"""
Deals module — Repository layer.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.deals.models import Deal
from app.shared.enums import DealStatus


class DealRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, deal: Deal) -> Deal:
        self.db.add(deal)
        await self.db.flush()
        await self.db.refresh(deal)
        return deal

    async def get_by_id(self, deal_id: uuid.UUID) -> Optional[Deal]:
        result = await self.db.execute(
            select(Deal).options(joinedload(Deal.case)).where(Deal.id == deal_id)
        )
        return result.scalar_one_or_none()

    async def get_by_case_id(self, case_id: uuid.UUID) -> Optional[Deal]:
        result = await self.db.execute(
            select(Deal).options(joinedload(Deal.case)).where(Deal.case_id == case_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self, status: Optional[DealStatus] = None, offset: int = 0, limit: int = 20
    ) -> List[Deal]:
        query = select(Deal).options(joinedload(Deal.case))
        if status:
            query = query.where(Deal.status == status)
        query = query.offset(offset).limit(limit).order_by(Deal.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[DealStatus] = None) -> int:
        query = select(func.count(Deal.id))
        if status:
            query = query.where(Deal.status == status)
        result = await self.db.execute(query)
        return result.scalar() or 0  # type: ignore[return-value]

    async def update(self, deal: Deal) -> Deal:
        await self.db.flush()
        await self.db.refresh(deal)
        return deal
