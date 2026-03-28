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
    """Lawyer dashboard summary."""
    from app.modules.cases.repository import CaseRepository
    from app.modules.kyc.repository import KYCRepository
    from app.shared.enums import CaseStatus

    lawyer_id = uuid.UUID(current_user["user_id"])
    case_repo = CaseRepository(db)

    # Get assigned cases
    assigned_cases = await case_repo.get_by_lawyer_id(lawyer_id)
    active_statuses = {CaseStatus.UNDER_REVIEW, CaseStatus.APPROVED, CaseStatus.LISTED, CaseStatus.AUCTION}
    active = [c for c in assigned_cases if c.status in active_statuses]

    # Get pending KYC count
    try:
        kyc_repo = KYCRepository(db)
        pending_kyc = await kyc_repo.get_pending_reviews(limit=1000)
        pending_kyc_count = len(pending_kyc)
    except Exception:
        pending_kyc_count = 0

    return {
        "total_cases": len(assigned_cases),
        "active_cases": len(active),
        "pending_kyc_reviews": pending_kyc_count,
        "pending_review": sum(1 for c in assigned_cases if c.status == CaseStatus.UNDER_REVIEW),
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
