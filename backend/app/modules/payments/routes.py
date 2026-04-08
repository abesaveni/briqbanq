"""
Payments module — Square Payment Links.
Backend creates a hosted Square checkout URL; frontend redirects user there.
No Web Payments SDK needed — avoids all applicationId format issues.
"""

import uuid
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.modules.cases.models import Case
from app.modules.identity.models import User
from app.infrastructure.email_service import EmailService

router = APIRouter(prefix="/payments", tags=["Payments"])


def _square_headers():
    return {
        "Authorization": f"Bearer {settings.square_access_token}",
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
    }


def _square_base():
    if settings.square_environment == "production":
        return "https://connect.squareup.com"
    return "https://connect.squareupsandbox.com"


class CreateLinkRequest(BaseModel):
    amount_cents: int = 25000   # $250.00 AUD
    currency: str = "AUD"
    case_id: Optional[str] = None
    redirect_url: Optional[str] = None   # where Square sends user after payment


class CreateLinkResponse(BaseModel):
    payment_link_url: str
    payment_link_id: str
    order_id: str


class VerifyPaymentRequest(BaseModel):
    order_id: str


class VerifyPaymentResponse(BaseModel):
    paid: bool
    status: str
    payment_id: Optional[str] = None


@router.post("/create-link", response_model=CreateLinkResponse)
async def create_payment_link(
    body: CreateLinkRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a Square hosted payment link for case onboarding fee.
    Returns the URL to send the user to.
    """
    if not settings.square_access_token or not settings.square_location_id:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured. Please contact support.",
        )

    # Build redirect URL — back to the new-case page after payment
    redirect_url = body.redirect_url
    if not redirect_url:
        origin = str(request.base_url).rstrip("/")
        redirect_url = f"{origin}/borrower/new-case"

    payload = {
        "idempotency_key": str(uuid.uuid4()),
        "order": {
            "location_id": settings.square_location_id,
            "line_items": [
                {
                    "name": "BriqBanq Case Onboarding & Verification",
                    "quantity": "1",
                    "base_price_money": {
                        "amount": body.amount_cents,
                        "currency": body.currency,
                    },
                }
            ],
            "reference_id": body.case_id or "",
        },
        "checkout_options": {
            "redirect_url": redirect_url,
            "ask_for_shipping_address": False,
            "merchant_support_email": "support@briqbanq.com",
        },
        "pre_populated_data": {},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{_square_base()}/v2/online-checkout/payment-links",
            json=payload,
            headers=_square_headers(),
        )

    data = resp.json()

    if resp.status_code in (200, 201) and "payment_link" in data:
        link = data["payment_link"]
        return CreateLinkResponse(
            payment_link_url=link["url"],
            payment_link_id=link["id"],
            order_id=link.get("order_id", ""),
        )

    errors = data.get("errors", [])
    detail = errors[0].get("detail", "Could not create payment link") if errors else str(data)
    raise HTTPException(status_code=502, detail=detail)


class RecordPaymentRequest(BaseModel):
    case_id: str
    order_id: str
    payment_id: Optional[str] = None
    amount_cents: int = 25000
    currency: str = "AUD"


@router.post("/record")
async def record_payment(
    body: RecordPaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record a confirmed payment: persist receipt to case metadata and email borrower.
    Called by frontend once Square polling confirms paid=True.
    """
    case_result = await db.execute(select(Case).where(Case.id == body.case_id))
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    # Merge payment info into case metadata
    meta = dict(case.metadata_json or {})
    paid_at = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
    meta["payment_status"] = "paid"
    meta["payment_amount_cents"] = body.amount_cents
    meta["payment_currency"] = body.currency
    meta["payment_order_id"] = body.order_id
    meta["payment_id"] = body.payment_id or ""
    meta["payment_date"] = paid_at
    case.metadata_json = meta
    await db.commit()

    # Send receipt email to borrower
    borrower_result = await db.execute(select(User).where(User.id == case.borrower_id))
    borrower = borrower_result.scalar_one_or_none()
    if borrower and borrower.email:
        amount_display = f"A${body.amount_cents / 100:.2f}"
        case_number = case.case_number or str(case.id)[:8].upper()
        try:
            await EmailService.send_payment_receipt_email(
                to_email=borrower.email,
                borrower_name=borrower.full_name or borrower.email,
                case_id=str(case.id),
                case_number=case_number,
                amount_display=amount_display,
                order_id=body.order_id,
                payment_id=body.payment_id or "N/A",
                paid_at=paid_at,
            )
        except Exception:
            pass  # Don't fail the request if email fails

    return {"ok": True, "case_id": str(case.id)}


@router.get("/verify/{order_id}", response_model=VerifyPaymentResponse)
async def verify_payment(
    order_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Check if an order has been paid (called after Square redirects back).
    """
    if not settings.square_access_token:
        raise HTTPException(status_code=503, detail="Payment service not configured.")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_square_base()}/v2/orders/{order_id}",
            headers=_square_headers(),
        )

    data = resp.json()
    if resp.status_code == 200 and "order" in data:
        order = data["order"]
        state = order.get("state", "OPEN")
        tenders = order.get("tenders", [])
        payment_id = tenders[0].get("payment_id") if tenders else None
        # Square keeps order in OPEN state after payment via sandbox testing panel.
        # Consider paid if there is at least one tender (payment collected).
        paid = len(tenders) > 0 or state == "COMPLETED"
        return VerifyPaymentResponse(
            paid=paid,
            status=state,
            payment_id=payment_id,
        )

    return VerifyPaymentResponse(paid=False, status="UNKNOWN")
