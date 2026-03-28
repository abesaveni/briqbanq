"""Borrower module service."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.cases.repository import CaseRepository
from app.shared.enums import CaseStatus

class BorrowerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.case_repo = CaseRepository(db)

    async def get_dashboard_stats(self, borrower_id: uuid.UUID) -> dict:
        cases = await self.case_repo.get_by_borrower(borrower_id)
        active_cases = len([c for c in cases if c.status not in [CaseStatus.CLOSED, CaseStatus.DRAFT]])
        # Mock funding progress based on deals?
        return {
            "active_cases": active_cases,
            "funding_progress": 0.0,
            "pending_tasks": 0,
        }

    async def get_dashboard_actions(self, borrower_id: uuid.UUID) -> list:
        # pending tasks logic
        return []
