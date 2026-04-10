"""Lawyer module routes."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, get_db

router = APIRouter(prefix="/lawyer", tags=["Lawyer"])


@router.get("/dashboard")
async def get_lawyer_dashboard(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Lawyer dashboard summary — returns 6 stat counts."""
    from app.modules.cases.repository import CaseRepository
    from app.modules.auctions.repository import AuctionRepository
    from app.shared.enums import CaseStatus, AuctionStatus

    lawyer_id = uuid.UUID(current_user["user_id"])
    case_repo = CaseRepository(db)

    # My Cases: cases I created (borrower_id = me), excluding DRAFT
    my_cases = await case_repo.get_by_borrower(lawyer_id, limit=1000)
    my_cases_count = sum(1 for c in my_cases if c.status != CaseStatus.DRAFT)

    # Assigned Cases: cases assigned to me by admin
    assigned_cases = await case_repo.get_by_lawyer_id(lawyer_id, limit=1000)
    assigned_cases_count = len(assigned_cases)

    # Pending Review: my created cases awaiting review
    pending_review_count = sum(
        1 for c in my_cases
        if c.status in {CaseStatus.SUBMITTED, CaseStatus.UNDER_REVIEW}
    )

    # Approved: my created cases that are APPROVED
    approved_count = sum(1 for c in my_cases if c.status == CaseStatus.APPROVED)

    # Live Auctions: all platform auctions that are LIVE
    try:
        auction_repo = AuctionRepository(db)
        live_auctions_count = await auction_repo.count(status=AuctionStatus.LIVE)
    except Exception:
        live_auctions_count = 0

    # My Cases In Auction: my created cases in AUCTION status
    my_in_auction_count = sum(1 for c in my_cases if c.status == CaseStatus.AUCTION)

    return {
        "my_cases_count": my_cases_count,
        "assigned_cases_count": assigned_cases_count,
        "pending_review_count": pending_review_count,
        "approved_count": approved_count,
        "live_auctions_count": live_auctions_count,
        "my_in_auction_count": my_in_auction_count,
    }


@router.get("/assigned-cases")
async def get_lawyer_assigned_cases(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get cases assigned to the current lawyer."""
    from app.modules.cases.repository import CaseRepository
    from app.modules.cases.schemas import CaseResponse
    lawyer_id = uuid.UUID(current_user["user_id"])
    repo = CaseRepository(db)
    cases = await repo.get_by_lawyer_id(lawyer_id)
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/case/{case_id}")
async def get_lawyer_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a specific case assigned to the lawyer."""
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
