"""Loans module routes."""
import uuid
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_db
from app.modules.loans.schemas import LoanRepayRequest, LoanRepayResponse
from app.modules.loans.service import LoanService

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.get("/dashboard")
async def get_lender_dashboard(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Lender dashboard summary — filtered to cases assigned to this lender."""
    from app.modules.cases.repository import CaseRepository
    from app.shared.enums import CaseStatus
    lender_id = uuid.UUID(current_user["user_id"])
    repo = CaseRepository(db)
    cases = await repo.get_by_lender_id(lender_id)
    active_statuses = {CaseStatus.AUCTION, CaseStatus.LISTED, CaseStatus.UNDER_REVIEW}
    active = [c for c in cases if c.status in active_statuses]
    total_value = sum(float(c.outstanding_debt or 0) for c in cases)
    pending = [c for c in cases if c.status in {CaseStatus.SUBMITTED, CaseStatus.UNDER_REVIEW}]
    return {
        "totalCases": len(cases),
        "activeCases": len(active),
        "totalValue": total_value,
        "pendingReview": len(pending),
    }


@router.get("/portfolio")
async def get_lender_portfolio(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Lender portfolio — cases assigned to this lender."""
    from app.modules.cases.repository import CaseRepository
    from app.modules.cases.schemas import CaseResponse
    lender_id = uuid.UUID(current_user["user_id"])
    repo = CaseRepository(db)
    cases = await repo.get_by_lender_id(lender_id)
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/my-cases")
async def get_lender_my_cases(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Cases where this user is the assigned lender."""
    from app.modules.cases.repository import CaseRepository
    from app.modules.cases.schemas import CaseResponse
    lender_id = uuid.UUID(current_user["user_id"])
    repo = CaseRepository(db)
    cases = await repo.get_by_lender_id(lender_id)
    return [CaseResponse.model_validate(c) for c in cases]


@router.post("/repay", response_model=LoanRepayResponse)
async def repay_loan(
    request: LoanRepayRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = LoanService(db)
    return await service.repay_loan(
        borrower_id=uuid.UUID(current_user["user_id"]),
        deal_id=request.deal_id,
        amount=request.amount
    )
