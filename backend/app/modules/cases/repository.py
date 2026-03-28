"""
Cases module — Repository layer.
Raw database access only — no business rules.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cases.models import Case
from app.shared.enums import CaseStatus


class CaseRepository:
    """Repository for Case CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, case: Case) -> Case:
        """Create a new case."""
        self.db.add(case)
        await self.db.flush()
        await self.db.refresh(case)
        return case

    async def get_by_id(self, case_id: uuid.UUID) -> Optional[Case]:
        """Get a case by ID."""
        result = await self.db.execute(
            select(Case).where(Case.id == case_id)
        )
        return result.scalar_one_or_none()

    async def get_by_borrower(
        self,
        borrower_id: uuid.UUID,
        status: Optional[CaseStatus] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[Case]:
        """Get all cases for a borrower."""
        query = select(Case).where(Case.borrower_id == borrower_id)
        if status:
            query = query.where(Case.status == status)
        query = query.offset(offset).limit(limit).order_by(Case.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all(
        self,
        status: Optional[CaseStatus] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[Case]:
        """Get all cases with optional status filter."""
        query = select(Case)
        if status:
            query = query.where(Case.status == status)
        query = query.offset(offset).limit(limit).order_by(Case.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[CaseStatus] = None) -> int:
        """Count cases with optional status filter."""
        query = select(func.count(Case.id))
        if status:
            query = query.where(Case.status == status)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def update(self, case: Case) -> Case:
        """Update a case."""
        await self.db.flush()
        await self.db.refresh(case)
        return case

    async def delete(self, case: Case) -> None:
        """Delete a case."""
        await self.db.delete(case)
        await self.db.flush()

    async def get_for_review(
        self, offset: int = 0, limit: int = 20
    ) -> List[Case]:
        """Get cases submitted for review."""
        result = await self.db.execute(
            select(Case)
            .where(Case.status.in_([CaseStatus.SUBMITTED, CaseStatus.UNDER_REVIEW]))
            .offset(offset)
            .limit(limit)
            .order_by(Case.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_lawyer_id(
        self, lawyer_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> List[Case]:
        """Get cases assigned to a specific lawyer."""
        result = await self.db.execute(
            select(Case)
            .where(Case.assigned_lawyer_id == lawyer_id)
            .offset(offset)
            .limit(limit)
            .order_by(Case.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_lender_id(
        self, lender_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> List[Case]:
        """Get cases assigned to a specific lender."""
        result = await self.db.execute(
            select(Case)
            .where(Case.assigned_lender_id == lender_id)
            .offset(offset)
            .limit(limit)
            .order_by(Case.created_at.desc())
        )
        return list(result.scalars().all())
