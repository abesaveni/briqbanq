"""
Deals module — FastAPI routes.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.deals.policies import DealPolicy
from app.modules.deals.schemas import (
    DealCreateRequest,
    DealListResponse,
    DealResponse,
    DealUpdateRequest,
)
from app.modules.deals.service import DealService
from app.shared.enums import DealStatus

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.post("", response_model=DealResponse, status_code=201)
async def create_deal(
    request: DealCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Create a deal from an approved case (admin only)."""
    DealPolicy.can_create_deal(current_user)

    # Verify case is approved
    from app.modules.cases.service import CaseService
    case_service = CaseService(db)
    case = await case_service.get_case(request.case_id)

    service = DealService(db)
    deal = await service.create_deal(
        case_id=request.case_id,
        title=request.title,
        description=request.description,
        asking_price=request.asking_price,
        reserve_price=request.reserve_price,
        seller_id=case.borrower_id,
        created_by=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="deal",
        entity_id=str(deal.id),
        action="CREATE_DEAL",
        before_state=None,
        after_state={"status": "DRAFT", "case_id": str(request.case_id)},
        trace_id=trace_id,
    )

    return deal


@router.post("/{deal_id}/list", response_model=DealResponse)
async def list_deal(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """List a deal for auction (admin only)."""
    DealPolicy.can_manage_deal(current_user)
    service = DealService(db)
    deal = await service.list_deal(deal_id, trace_id)

    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="deal", entity_id=str(deal_id),
        action="LIST_DEAL",
        before_state={"status": "DRAFT"}, after_state={"status": "LISTED"},
        trace_id=trace_id,
    )
    return deal


@router.post("/{deal_id}/close", response_model=DealResponse)
async def close_deal(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Close a deal (admin only)."""
    DealPolicy.can_manage_deal(current_user)
    service = DealService(db)
    deal = await service.close_deal(deal_id, trace_id)

    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="deal", entity_id=str(deal_id),
        action="CLOSE_DEAL",
        before_state=None, after_state={"status": "CLOSED"},
        trace_id=trace_id,
    )
    return deal


@router.get("", response_model=DealListResponse)
async def list_all_deals(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all deals."""
    service = DealService(db)
    
    # Enforce investor visibility: non-admins only see LISTED deals
    user_roles = current_user.get("roles", [])
    is_admin = "ADMIN" in user_roles or current_user.get("is_admin", False)
    
    if not is_admin:
        if status and status != DealStatus.LISTED.value:
            # Investors/Lenders searching for non-public statuses get empty result
            return DealListResponse(items=[], total=0, page=page, page_size=page_size)
        deal_status = DealStatus.LISTED
    else:
        deal_status = DealStatus(status) if status else None

    offset = (page - 1) * page_size
    deals, total = await service.get_all_deals(status=deal_status, offset=offset, limit=page_size)
    
    # Explicit conversion to Pydantic objects to fix type errors
    return DealListResponse(
        items=[DealResponse.model_validate(d) for d in deals],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a specific deal."""
    service = DealService(db)
    return await service.get_deal(deal_id)


# ─── Deal Purchase ─────────────────────────────────────────────────────────────

@router.get("/{deal_id}/purchase")
async def get_deal_purchase(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get purchase details for a buy-now deal."""
    service = DealService(db)
    deal = await service.get_deal(deal_id)
    return {
        "deal_id": str(deal_id),
        "title": deal.title,
        "asking_price": str(deal.asking_price),
        "status": deal.status.value,
        "property_address": deal.property_address,
        "buyer_id": current_user.get("user_id"),
        "can_purchase": deal.status.value == "LISTED",
    }


@router.post("/{deal_id}/purchase")
async def purchase_deal(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Purchase a buy-now deal (investor)."""
    service = DealService(db)
    deal = await service.get_deal(deal_id)

    if deal.status.value != "LISTED":
        from app.core.exceptions import InvalidStateTransitionError
        raise InvalidStateTransitionError(message="Deal is not available for purchase")

    buyer_id = uuid.UUID(current_user["user_id"])
    updated = await service.move_to_contract(deal_id, buyer_id, trace_id)

    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="deal",
        entity_id=str(deal_id),
        action="PURCHASE_DEAL",
        before_state={"status": "LISTED"},
        after_state={"status": "UNDER_CONTRACT", "buyer_id": str(buyer_id)},
        trace_id=trace_id,
    )

    return {
        "success": True,
        "deal_id": str(deal_id),
        "status": updated.status.value,
        "message": "Purchase successful. Contract will be generated shortly.",
    }


# ─── Deal Notes ────────────────────────────────────────────────────────────────

@router.get("/{deal_id}/notes")
async def get_deal_notes(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all notes for a deal."""
    from sqlalchemy import select
    from app.modules.platform.models import DealNote
    result = await db.execute(
        select(DealNote)
        .where(DealNote.deal_id == deal_id)
        .order_by(DealNote.created_at.desc())
    )
    notes = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "deal_id": str(n.deal_id),
            "author_id": str(n.author_id) if n.author_id else None,
            "author_name": n.author_name,
            "author_role": n.author_role,
            "content": n.content,
            "is_pinned": n.is_pinned,
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]


@router.post("/{deal_id}/notes", status_code=201)
async def add_deal_note(
    deal_id: uuid.UUID,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Add a note to a deal."""
    from app.modules.platform.models import DealNote
    # Verify deal exists
    service = DealService(db)
    await service.get_deal(deal_id)

    note = DealNote(
        deal_id=deal_id,
        author_id=uuid.UUID(current_user["user_id"]),
        author_name=payload.get("author_name", current_user.get("email", "")),
        author_role=",".join(current_user.get("roles", [])),
        content=payload.get("content", ""),
        is_pinned=payload.get("is_pinned", False),
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return {
        "id": str(note.id),
        "deal_id": str(note.deal_id),
        "author_id": str(note.author_id) if note.author_id else None,
        "author_name": note.author_name,
        "author_role": note.author_role,
        "content": note.content,
        "is_pinned": note.is_pinned,
        "created_at": note.created_at.isoformat(),
    }


@router.delete("/{deal_id}/notes/{note_id}")
async def delete_deal_note(
    deal_id: uuid.UUID,
    note_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a deal note."""
    from sqlalchemy import select
    from app.modules.platform.models import DealNote
    result = await db.execute(
        select(DealNote).where(DealNote.id == note_id, DealNote.deal_id == deal_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError(message="Note not found")
    await db.delete(note)
    return {"success": True, "id": str(note_id)}
