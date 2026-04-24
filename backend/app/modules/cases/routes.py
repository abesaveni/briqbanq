"""
Cases module — FastAPI routes.
Calls service layer only. No direct DB calls. No business logic.
"""

import uuid
import pathlib
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.cases.policies import CasePolicy
from app.modules.cases.schemas import (
    CaseAdminUpdateRequest,
    CaseAssignRequest,
    CaseCreateRequest,
    CaseListResponse,
    CaseResponse,
    CaseReviewRequest,
    CaseUpdateRequest,
    CaseStatusUpdateRequest,
    CaseMetadataUpdateRequest,
    LawyerChecklistRequest,
)
from app.modules.cases.service import CaseService
from app.modules.cases.pdf_service import CasePDFService
from app.modules.identity.schemas import MessageResponse
from app.shared.enums import CaseStatus, DocumentStatus

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.patch("/{case_id}/metadata", response_model=CaseResponse)
async def update_case_metadata(
    case_id: uuid.UUID,
    request: CaseMetadataUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Update case metadata (e.g. compliance checklists)."""
    service = CaseService(db)
    case = await service.update_case_metadata(
        case_id=case_id,
        metadata=request.metadata,
        trace_id=trace_id,
    )
    return case


@router.post("/{case_id}/lawyer-complete-review", response_model=CaseResponse)
async def lawyer_complete_review(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Mark lawyer review as complete and notify admins (lawyer only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.complete_lawyer_review(
        case_id=case_id,
        lawyer_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="case",
        entity_id=str(case_id),
        action="LAWYER_REVIEW_COMPLETE",
        before_state={"status": "UNDER_REVIEW"},
        after_state={"lawyer_review_submitted": True},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/lawyer-checklist", response_model=CaseResponse)
async def save_lawyer_checklist(
    case_id: uuid.UUID,
    request: LawyerChecklistRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Save lawyer compliance checklist progress for a case (lawyer/admin only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.save_lawyer_checklist(
        case_id=case_id,
        lawyer_id=uuid.UUID(current_user["user_id"]),
        checklist=request.checklist,
        notes=request.notes,
        trace_id=trace_id,
    )
    return case


@router.post("/", response_model=CaseResponse, status_code=201)
async def create_case(
    request: CaseCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Create a new MIP case (Lender, Lawyer, Investor, Admin only)."""
    CasePolicy.can_create_case(current_user)
    service = CaseService(db)
    case = await service.create_case(
        borrower_id=uuid.UUID(current_user["user_id"]),
        title=request.title,
        description=request.description,
        property_address=request.property_address,
        property_type=request.property_type,
        estimated_value=request.estimated_value,
        outstanding_debt=request.outstanding_debt,
        interest_rate=request.interest_rate,
        tenure=request.tenure,
        metadata_json=request.metadata_json,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=current_user.get("roles", ["UNKNOWN"])[0],
        entity_type="case",
        entity_id=str(case.id),
        action="CREATE_CASE",
        before_state=None,
        after_state={"status": "DRAFT", "title": case.title},
        trace_id=trace_id,
    )

    return case


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: uuid.UUID,
    request: CaseUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Update a case (Lender, Lawyer, Admin only — in DRAFT status)."""
    CasePolicy.can_edit_case(current_user, current_user["user_id"])
    service = CaseService(db)
    case = await service.update_case(
        case_id=case_id,
        borrower_id=uuid.UUID(current_user["user_id"]),
        title=request.title,
        description=request.description,
        property_address=request.property_address,
        property_type=request.property_type,
        estimated_value=request.estimated_value,
        outstanding_debt=request.outstanding_debt,
        interest_rate=request.interest_rate,
        tenure=request.tenure,
        trace_id=trace_id,
        metadata_json=request.metadata_json,
        user_roles=current_user.get("roles", []),
        extra_meta={k: v for k, v in {
            "suburb": request.suburb,
            "postcode": request.postcode,
            "bedrooms": request.bedrooms,
            "bathrooms": request.bathrooms,
            "valuer_name": request.valuer_name,
        }.items() if v is not None} or None,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=current_user.get("roles", ["UNKNOWN"])[0],
        entity_type="case",
        entity_id=str(case_id),
        action="UPDATE_CASE",
        before_state=None,
        after_state={"status": case.status.value},
        trace_id=trace_id,
    )

    return case


@router.put("/{case_id}/admin-update", response_model=CaseResponse)
async def admin_update_case(
    case_id: uuid.UUID,
    request: CaseAdminUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Admin update — edits case fields regardless of status or ownership."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.admin_update_case(
        case_id=case_id,
        property_address=request.property_address,
        property_type=request.property_type,
        estimated_value=request.estimated_value,
        outstanding_debt=request.outstanding_debt,
        interest_rate=request.interest_rate,
        extra_meta={
            k: v for k, v in {
                "suburb": request.suburb,
                "postcode": request.postcode,
                "bedrooms": request.bedrooms,
                "bathrooms": request.bathrooms,
                "kitchens": request.kitchens,
                "default_rate": float(request.default_rate) if request.default_rate is not None else None,
                "days_in_default": request.days_in_default,
                "valuer_name": request.valuer_name,
            }.items() if v is not None
        },
        trace_id=trace_id,
    )
    return case


@router.put("/{case_id}/status", response_model=CaseResponse)
async def update_case_status_endpoint(
    case_id: uuid.UUID,
    request: CaseStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Update case status directly."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.update_case_status(
        case_id=case_id,
        new_status=request.status,
        admin_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )
    
    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="case",
        entity_id=str(case_id),
        action="UPDATE_STATUS",
        before_state=None,
        after_state={"status": request.status},
        trace_id=trace_id,
    )
    
    return case


@router.post("/{case_id}/submit", response_model=CaseResponse)
async def submit_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Submit a case for review (creator only)."""
    service = CaseService(db)
    case = await service.submit_case(
        case_id=case_id,
        borrower_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=current_user.get("roles", ["UNKNOWN"])[0],
        entity_type="case",
        entity_id=str(case_id),
        action="SUBMIT_CASE",
        before_state={"status": "DRAFT"},
        after_state={"status": "SUBMITTED"},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/review", response_model=CaseResponse)
async def start_case_review(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Start reviewing a submitted case (admin/lawyer only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.start_review(
        case_id=case_id,
        reviewer_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="case",
        entity_id=str(case_id),
        action="START_REVIEW",
        before_state={"status": "SUBMITTED"},
        after_state={"status": "UNDER_REVIEW"},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/approve", response_model=CaseResponse)
async def approve_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Approve a case under review (admin/lawyer only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.approve_case(
        case_id=case_id,
        reviewer_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="case",
        entity_id=str(case_id),
        action="APPROVE_CASE",
        before_state={"status": "UNDER_REVIEW"},
        after_state={"status": "APPROVED"},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/reject", response_model=CaseResponse)
async def reject_case(
    case_id: uuid.UUID,
    request: CaseReviewRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Reject a case and return to draft for corrections (admin/lawyer only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.reject_case(
        case_id=case_id,
        reviewer_id=uuid.UUID(current_user["user_id"]),
        reason=request.rejection_reason,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="case",
        entity_id=str(case_id),
        action="REJECT_CASE",
        before_state={"status": "UNDER_REVIEW"},
        after_state={"status": "REJECTED", "reason": request.rejection_reason},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/list", response_model=CaseResponse)
async def list_case_for_auction(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """List an approved case for auction (admin only)."""
    CasePolicy.can_list_all_cases(current_user)
    service = CaseService(db)
    case = await service.list_case(
        case_id=case_id,
        admin_id=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="case",
        entity_id=str(case_id),
        action="LIST_CASE",
        before_state={"status": "APPROVED"},
        after_state={"status": "LISTED"},
        trace_id=trace_id,
    )

    return case


@router.post("/{case_id}/assign", response_model=CaseResponse)
async def assign_participants(
    case_id: uuid.UUID,
    request: CaseAssignRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Assign a lawyer and/or lender to a case (admin only)."""
    CasePolicy.can_assign_participants(current_user)
    service = CaseService(db)
    case = await service.assign_participants(
        case_id=case_id,
        lawyer_id=request.lawyer_id,
        lender_id=request.lender_id,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="case",
        entity_id=str(case_id),
        action="ASSIGN_PARTICIPANTS",
        before_state=None,
        after_state={
            "lawyer_id": str(request.lawyer_id) if request.lawyer_id else None,
            "lender_id": str(request.lender_id) if request.lender_id else None,
        },
        trace_id=trace_id,
    )

    return case



@router.get("/assigned-to-me", response_model=list[CaseResponse])
async def get_assigned_cases(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get cases assigned to the current lawyer."""
    from app.modules.cases.repository import CaseRepository
    repo = CaseRepository(db)
    cases = await repo.get_by_lawyer_id(uuid.UUID(current_user["user_id"]))
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/live", response_model=list[CaseResponse])
async def get_live_listings(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all cases in LISTED or AUCTION status — visible to all authenticated users."""
    from app.modules.auctions.repository import AuctionRepository
    from app.modules.bids.repository import BidRepository
    service = CaseService(db)
    cases = await service.get_live_cases()
    auction_repo = AuctionRepository(db)
    bid_repo = BidRepository(db)
    responses = []
    from app.modules.auctions.service import AuctionService
    from app.shared.enums import AuctionStatus
    auction_service = AuctionService(db)
    for c in cases:
        # Auto-start SCHEDULED auctions for cases already in AUCTION status
        auction_status_val = getattr(c, "_auction_status", None)
        if c.status.value == "AUCTION" and auction_status_val == "SCHEDULED":
            try:
                auctions_list = await auction_repo.get_by_case_id(c.id)
                if auctions_list and auctions_list[0].status == AuctionStatus.SCHEDULED:
                    started = await auction_service.start_auction(auctions_list[0].id, "auto")
                    c._auction_status = started.status.value
            except Exception:
                pass

        resp = CaseResponse.model_validate(c)
        resp.auction_status = getattr(c, "_auction_status", None)
        resp.auction_scheduled_end = getattr(c, "_auction_scheduled_end", None)
        # Attach bid count and highest bid from linked auction
        try:
            auctions = await auction_repo.get_by_case_id(c.id)
            if auctions:
                auction = auctions[0]
                resp.bid_count = await bid_repo.count_auction_bids(auction.id)
                resp.current_highest_bid = float(auction.current_highest_bid) if auction.current_highest_bid else None
        except Exception:
            pass
        responses.append(resp)
    return responses


@router.get("/my-cases", response_model=list[CaseResponse])
async def get_my_cases(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get current user's cases (borrower)."""
    service = CaseService(db)
    case_status = CaseStatus(status) if status else None
    offset = (page - 1) * page_size
    cases = await service.get_borrower_cases(
        borrower_id=uuid.UUID(current_user["user_id"]),
        status=case_status,
        offset=offset,
        limit=page_size,
    )
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/review-queue", response_model=list[CaseResponse])
async def get_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get cases submitted for review (admin/lawyer only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    offset = (page - 1) * page_size
    cases = await service.get_cases_for_review(offset=offset, limit=page_size)
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/", response_model=CaseListResponse)
async def list_all_cases(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(500, ge=1, le=500),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all cases (admin only)."""
    CasePolicy.can_list_all_cases(current_user)
    service = CaseService(db)
    case_status = CaseStatus(status) if status else None
    offset = (page - 1) * page_size
    cases, total = await service.get_all_cases(
        status=case_status, offset=offset, limit=page_size
    )
    return CaseListResponse(items=cases, total=total, page=page, page_size=page_size)  # type: ignore[arg-type]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a specific case."""
    service = CaseService(db)
    case = await service.get_case(case_id)
    CasePolicy.can_view_case(current_user, str(case.borrower_id))
    return case


@router.get("/{case_id}/export")
async def export_case_report(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Export a case report as PDF."""
    service = CaseService(db)
    
    # Try to convert to UUID to see if it's a real case
    is_uuid = True
    try:
        uuid_obj = uuid.UUID(case_id)
    except ValueError:
        is_uuid = False

    if is_uuid:
        case = await service.get_case(uuid_obj)
        CasePolicy.can_view_case(current_user, str(case.borrower_id))

        # Construct complete report data from DB
        report_data = {
            "id": str(case.id),
            "title": case.title,
            "status": case.status.value,
            "borrower_name": case.borrower_name,
            "property_address": case.property_address,
            "property_type": case.property_type,
            "estimated_value": float(case.estimated_value),
            "outstanding_debt": float(case.outstanding_debt),
            "lender_name": case.lender_name,
            "lawyer_name": case.lawyer_name,
            "risk_level": case.risk_level,
            "created_at": case.created_at.isoformat(),
        }
    else:
        # Fallback to mock data for non-UUID IDs (e.g. MIP-2026-001)
        from datetime import datetime
        report_data = {
            "id": case_id,
            "title": f"Mock Case: {case_id}",
            "status": "In Auction",
            "borrower_name": "Madhu Munigala",
            "property_address": "45 Victoria Street, Potts Point, NSW 2011",
            "property_type": "Apartment",
            "estimated_value": 1250000.0,
            "outstanding_debt": 980000.0,
            "lender_name": "Commonwealth Bank",
            "lawyer_name": "Jennifer Wong",
            "risk_level": "Medium",
            "created_at": datetime.utcnow().isoformat(),
        }
    
    pdf_service = CasePDFService()
    pdf_stream = pdf_service.generate_case_report(report_data)
    
    response = Response(content=pdf_stream.getvalue(), media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=Case-Report-{case_id}.pdf"
    return response

@router.delete("/{case_id}", response_model=MessageResponse)
async def delete_case_endpoint(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Delete a case. Admins can delete any case; lenders/lawyers can delete their own cases."""
    from app.modules.cases.repository import CaseRepository
    from app.core.exceptions import AuthorizationError, ResourceNotFoundError
    repo = CaseRepository(db)
    case = await repo.get_by_id(case_id)
    if not case:
        raise ResourceNotFoundError("Case not found")

    user_id = current_user["user_id"]
    # roles is a list in JWT payload (e.g. ["admin"] or ["ADMIN"])
    user_roles = [r.upper() for r in (current_user.get("roles") or [current_user.get("role", "")])]
    user_role = user_roles[0] if user_roles else ""

    is_admin = "ADMIN" in user_roles

    if not is_admin:
        # Non-admin can only delete their own cases before approval
        case_status = case.status.value if hasattr(case.status, "value") else str(case.status)
        is_owner = (
            str(getattr(case, "borrower_id", None)) == str(user_id)
            or str(getattr(case, "assigned_lender_id", None)) == str(user_id)
            or str(getattr(case, "assigned_lawyer_id", None)) == str(user_id)
        )
        if not is_owner:
            raise AuthorizationError("You do not have permission to delete this case")
        owner_deletable = {"DRAFT", "SUBMITTED"}
        if case_status.upper() not in owner_deletable:
            raise AuthorizationError(
                f"You can only delete a case before it is approved. "
                f"Current status: {case_status}"
            )
    # Admins can delete any case regardless of status

    service = CaseService(db)
    await service.delete_case(
        case_id=case_id,
        admin_id=uuid.UUID(user_id),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=user_id,
        actor_role=user_role or "LENDER",
        entity_type="case",
        entity_id=str(case_id),
        action="DELETE_CASE",
        before_state=None,
        after_state=None,
        trace_id=trace_id,
    )

    return MessageResponse(message="Case deleted successfully")


# ─── Move to Auction ─────────────────────────────────────────────────────────

from pydantic import BaseModel as _PydanticBase, Field as _Field
from decimal import Decimal as _Decimal
from datetime import datetime as _datetime

class MoveToAuctionRequest(_PydanticBase):
    end_date: _datetime = _Field(..., description="Auction end date/time (UTC)")
    reserve_price: _Decimal = _Field(..., gt=0, description="Minimum acceptable bid")
    minimum_increment: _Decimal = _Field(default=_Decimal("1000"), gt=0)
    notes: str = _Field(default="", max_length=1000)


@router.post("/{case_id}/move-to-auction", status_code=201)
async def move_case_to_auction(
    case_id: uuid.UUID,
    request: MoveToAuctionRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Admin-only: atomically create a Deal + Auction record and move case to AUCTION status."""
    from app.core.exceptions import AuthorizationError, ResourceNotFoundError
    from app.modules.cases.repository import CaseRepository
    from app.modules.deals.models import Deal
    from app.modules.auctions.models import Auction as AuctionModel
    from app.shared.enums import DealStatus, AuctionStatus, CaseStatus
    from datetime import datetime, timezone
    from sqlalchemy import select as _sa_select

    roles = [r.upper() for r in (current_user.get("roles") or [])]
    if "ADMIN" not in roles:
        raise AuthorizationError("Only admins can move cases to auction")

    case_repo = CaseRepository(db)
    case = await case_repo.get_by_id(case_id)
    if not case:
        raise ResourceNotFoundError("Case not found")
    if case.status not in (CaseStatus.APPROVED, CaseStatus.LISTED):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Case must be APPROVED to move to auction (current: {case.status.value})")

    # Find or create Deal for this case
    result = await db.execute(_sa_select(Deal).where(Deal.case_id == case_id))
    deal = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if not deal:
        deal = Deal(
            case_id=case_id,
            title=case.title or case.property_address or f"Case {case.case_number}",
            asking_price=request.reserve_price,
            reserve_price=request.reserve_price,
            status=DealStatus.LISTED,
            seller_id=case.borrower_id,
            created_by=uuid.UUID(current_user["user_id"]),
        )
        db.add(deal)
        await db.flush()  # get deal.id

    # Create Auction record (LIVE immediately)
    auction = AuctionModel(
        deal_id=deal.id,
        title=case.title or case.property_address or f"Case {case.case_number}",
        starting_price=request.reserve_price,
        minimum_increment=request.minimum_increment,
        status=AuctionStatus.LIVE,
        scheduled_start=now,
        scheduled_end=request.end_date,
        actual_start=now,
        created_by=uuid.UUID(current_user["user_id"]),
    )
    db.add(auction)

    # Update case status to AUCTION
    case.status = CaseStatus.AUCTION
    case.version += 1

    await db.commit()
    await db.refresh(auction)

    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="auction", entity_id=str(auction.id),
        action="MOVE_TO_AUCTION",
        before_state={"case_status": "APPROVED"},
        after_state={"case_status": "AUCTION", "auction_id": str(auction.id), "deal_id": str(deal.id)},
        trace_id=trace_id,
    )

    return {
        "success": True,
        "auction_id": str(auction.id),
        "deal_id": str(deal.id),
        "case_id": str(case_id),
        "auction_status": auction.status.value,
        "scheduled_end": auction.scheduled_end.isoformat(),
        "starting_price": float(auction.starting_price),
    }


# ─── Image upload directory ───────────────────────────────────────────────────
# Absolute path: backend/uploads/images/ — independent of CWD
_IMAGE_DIR = pathlib.Path(__file__).parent.parent.parent.parent / "uploads" / "images"
_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
_MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/{case_id}/images", status_code=200)
async def upload_case_image(
    case_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Upload a property image for a case. Stores path in case metadata_json."""
    service = CaseService(db)
    case = await service.get_case(case_id)
    # Borrower who owns the case, or admin
    from app.modules.cases.policies import CasePolicy
    CasePolicy.can_view_case(current_user, str(case.borrower_id))

    content_type = (file.content_type or "").lower().split(";")[0].strip()
    if content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=422, detail="Only JPEG, PNG, WEBP, or GIF images are allowed.")

    content = await file.read(_MAX_IMAGE_SIZE + 1)
    if len(content) > _MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="Image must be under 10 MB.")

    original_name = file.filename or "image.jpg"
    safe_name = pathlib.Path(original_name).name
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    dest = _IMAGE_DIR / unique_name
    dest.write_bytes(content)

    # Store URL path in case metadata_json
    image_url = f"/uploads/images/{unique_name}"
    metadata = dict(case.metadata_json or {})
    images = list(metadata.get("property_images", []))
    images.append(image_url)
    metadata["property_images"] = images

    from sqlalchemy import update as sa_update, insert as sa_insert
    from app.modules.cases.models import Case
    from app.modules.documents.models import Document
    
    await db.execute(
        sa_update(Case).where(Case.id == case_id).values(metadata_json=metadata)
    )
    
    # Also register as a formal document so it appears in "Documents" tabs
    await db.execute(
        sa_insert(Document).values(
            case_id=case_id,
            uploaded_by=uuid.UUID(current_user["user_id"]),
            document_name=f"Property Image - {original_name}",
            document_type="Property Image",
            file_name=unique_name,
            file_size=len(content),
            content_type=content_type,
            s3_key=f"local://{unique_name}",
            status=DocumentStatus.APPROVED # Property images uploaded by borrower are auto-approved for display
        )
    )
    
    # Also track in case_images table
    from app.modules.platform.models import CaseImage
    is_first = len(images) == 1
    db.add(CaseImage(
        case_id=case_id,
        uploaded_by=uuid.UUID(current_user["user_id"]),
        file_name=unique_name,
        file_path=str(dest),
        url=image_url,
        content_type=content_type,
        is_primary=is_first,
    ))

    await db.commit()

    return {"message": "Image uploaded successfully", "url": image_url, "all_images": images}


@router.get("/{case_id}/images", status_code=200)
async def get_case_images(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all property images for a case (from DB + metadata fallback)."""
    from sqlalchemy import select as sa_select
    from app.modules.platform.models import CaseImage
    service = CaseService(db)
    case = await service.get_case(case_id)
    CasePolicy.can_view_case(current_user, str(case.borrower_id))

    # Prefer DB records
    result = await db.execute(
        sa_select(CaseImage)
        .where(CaseImage.case_id == case_id)
        .order_by(CaseImage.is_primary.desc(), CaseImage.created_at)
    )
    db_images = result.scalars().all()
    if db_images:
        return {
            "images": [img.url or img.file_path for img in db_images],
            "records": [
                {
                    "id": str(img.id),
                    "url": img.url or img.file_path,
                    "file_name": img.file_name,
                    "is_primary": img.is_primary,
                }
                for img in db_images
            ],
        }

    # Fallback to metadata_json
    metadata = dict(case.metadata_json or {})
    return {"images": metadata.get("property_images", []), "records": []}


# ─── Case Chat (shared across all roles) ─────────────────────────────────────

@router.get("/{case_id}/messages")
async def get_case_messages(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all messages for a case. Accessible by any authenticated role."""
    from sqlalchemy import select
    from app.modules.cases.models import CaseMessage
    async with db as session:
        result = await session.execute(
            select(CaseMessage)
            .where(CaseMessage.case_id == case_id)
            .order_by(CaseMessage.created_at.asc())
        )
        msgs = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "case_id": str(m.case_id),
            "sender_id": str(m.sender_id) if m.sender_id else None,
            "sender_name": m.sender_name or "Unknown",
            "sender_role": m.sender_role or "User",
            "message": m.message,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]


@router.post("/{case_id}/messages")
async def send_case_message(
    case_id: uuid.UUID,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Post a message to a case chat. Accessible by any authenticated role."""
    from app.modules.cases.models import CaseMessage, CaseActivity
    from app.modules.identity.repository import UserRepository

    text = (body.get("message") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    user_id = uuid.UUID(current_user["user_id"])
    roles = current_user.get("roles", [])
    role_label = roles[0].capitalize() if roles else "User"

    # Resolve sender name
    try:
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        sender_name = f"{user.first_name} {user.last_name}".strip() if user else role_label
    except Exception:
        sender_name = role_label

    msg = CaseMessage(
        case_id=case_id,
        sender_id=user_id,
        sender_name=sender_name,
        sender_role=role_label,
        message=text,
    )

    activity = CaseActivity(
        case_id=case_id,
        actor_id=user_id,
        actor_name=sender_name,
        actor_role=role_label,
        event_type="message",
        title=f"Message from {sender_name}",
        description=text[:120] + ("…" if len(text) > 120 else ""),
    )

    async with db as session:
        session.add(msg)
        session.add(activity)
        await session.commit()
        await session.refresh(msg)

    return {
        "id": str(msg.id),
        "case_id": str(msg.case_id),
        "sender_id": str(msg.sender_id),
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "message": msg.message,
        "created_at": msg.created_at.isoformat(),
    }


# ─── Case Activity Log (shared across all roles) ──────────────────────────────

@router.get("/{case_id}/activity")
async def get_case_activity(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get the activity log for a case. Accessible by any authenticated role."""
    from sqlalchemy import select
    from app.modules.cases.models import CaseActivity
    async with db as session:
        result = await session.execute(
            select(CaseActivity)
            .where(CaseActivity.case_id == case_id)
            .order_by(CaseActivity.created_at.desc())
        )
        events = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "case_id": str(e.case_id),
            "actor_name": e.actor_name or "System",
            "actor_role": e.actor_role or "",
            "event_type": e.event_type,
            "title": e.title,
            "description": e.description or "",
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


# ─── Investment Memo / Flyer Generation ───────────────────────────────────────

@router.post("/{case_id}/generate-im")
async def generate_investment_memo(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generate an Investment Memorandum PDF for a case."""
    service = CaseService(db)
    case = await service.get_case(case_id)

    pdf_service = CasePDFService()
    report_data = {
        "id": str(case.id),
        "case_number": case.case_number or str(case.id)[:8].upper(),
        "title": case.title,
        "property_address": case.property_address,
        "property_type": case.property_type,
        "estimated_value": float(case.estimated_value),
        "outstanding_debt": float(case.outstanding_debt),
        "interest_rate": float(case.interest_rate) if case.interest_rate else None,
        "tenure": case.tenure,
        "status": case.status.value,
        "borrower_name": case.borrower_name,
        "description": case.description,
    }
    pdf_stream = pdf_service.generate_case_report(report_data)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="IM_{case.case_number or str(case.id)[:8]}.pdf"'
        },
    )


@router.post("/{case_id}/generate-flyer")
async def generate_case_flyer(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generate a marketing flyer PDF for a case."""
    service = CaseService(db)
    case = await service.get_case(case_id)

    pdf_service = CasePDFService()
    report_data = {
        "id": str(case.id),
        "case_number": case.case_number or str(case.id)[:8].upper(),
        "title": f"Property Flyer — {case.title}",
        "property_address": case.property_address,
        "property_type": case.property_type,
        "estimated_value": float(case.estimated_value),
        "outstanding_debt": float(case.outstanding_debt),
        "interest_rate": float(case.interest_rate) if case.interest_rate else None,
        "tenure": case.tenure,
        "status": case.status.value,
        "borrower_name": case.borrower_name,
        "description": case.description,
    }
    pdf_stream = pdf_service.generate_case_report(report_data)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Flyer_{case.case_number or str(case.id)[:8]}.pdf"'
        },
    )


@router.post("/{case_id}/ai-generate")
async def ai_generate_content(
    case_id: uuid.UUID,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """AI-assisted content generation for a case (stub — returns structured suggestions)."""
    service = CaseService(db)
    case = await service.get_case(case_id)
    content_type = payload.get("contentType", "description")

    suggestions = {
        "description": (
            f"This is a Mortgage-in-Possession (MIP) case for a {case.property_type} property "
            f"located at {case.property_address}. The estimated value is ${float(case.estimated_value):,.0f} "
            f"with an outstanding debt of ${float(case.outstanding_debt):,.0f}."
        ),
        "title": f"MIP — {case.property_type} at {case.property_address.split(',')[0]}",
        "highlights": [
            f"Estimated value: ${float(case.estimated_value):,.0f}",
            f"Outstanding debt: ${float(case.outstanding_debt):,.0f}",
            f"Property type: {case.property_type}",
            f"Location: {case.property_address}",
        ],
    }

    return {
        "content_type": content_type,
        "suggestion": suggestions.get(content_type, suggestions["description"]),
        "case_id": str(case_id),
    }


# ─── Archive / Unarchive ──────────────────────────────────────────────────────

@router.post("/{case_id}/archive")
async def archive_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Archive a case (admin only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.get_case(case_id)
    case.is_archived = True
    case.version += 1
    await service.repository.update(case)
    return {"success": True, "message": "Case archived"}


@router.post("/{case_id}/unarchive")
async def unarchive_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Unarchive a case (admin only)."""
    CasePolicy.can_review_case(current_user)
    service = CaseService(db)
    case = await service.get_case(case_id)
    case.is_archived = False
    case.version += 1
    await service.repository.update(case)
    return {"success": True, "message": "Case restored from archive"}


# ─── Message Delete / Edit ────────────────────────────────────────────────────

@router.delete("/{case_id}/messages/{message_id}")
async def delete_case_message(
    case_id: uuid.UUID,
    message_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a case message. Sender can delete own messages; admin/lawyer can delete any."""
    from sqlalchemy import select, delete as sa_delete
    from app.modules.cases.models import CaseMessage
    roles = set(current_user.get("roles", []))
    privileged = {"ADMIN", "LAWYER"}
    user_id = uuid.UUID(current_user["user_id"])

    async with db as session:
        result = await session.execute(
            select(CaseMessage).where(CaseMessage.id == message_id, CaseMessage.case_id == case_id)
        )
        msg = result.scalar_one_or_none()
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if not roles & privileged and msg.sender_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorised to delete this message")
        await session.delete(msg)
        await session.commit()
    return {"success": True, "message": "Message deleted"}


@router.patch("/{case_id}/messages/{message_id}")
async def edit_case_message(
    case_id: uuid.UUID,
    message_id: uuid.UUID,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Edit a case message text. Sender can edit own messages; admin/lawyer can edit any."""
    from sqlalchemy import select
    from app.modules.cases.models import CaseMessage
    roles = set(current_user.get("roles", []))
    privileged = {"ADMIN", "LAWYER"}
    user_id = uuid.UUID(current_user["user_id"])
    new_text = (body.get("message") or "").strip()
    if not new_text:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    async with db as session:
        result = await session.execute(
            select(CaseMessage).where(CaseMessage.id == message_id, CaseMessage.case_id == case_id)
        )
        msg = result.scalar_one_or_none()
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if not roles & privileged and msg.sender_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorised to edit this message")
        msg.message = new_text
        await session.commit()
        await session.refresh(msg)
    return {
        "id": str(msg.id),
        "case_id": str(msg.case_id),
        "sender_id": str(msg.sender_id) if msg.sender_id else None,
        "sender_name": msg.sender_name or "Unknown",
        "sender_role": msg.sender_role or "User",
        "message": msg.message,
        "created_at": msg.created_at.isoformat(),
        "edited": True,
    }
