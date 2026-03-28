"""Settlement module — Repository."""
import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.settlement.models import Settlement

class SettlementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, settlement: Settlement) -> Settlement:
        self.db.add(settlement)
        await self.db.flush()
        await self.db.refresh(settlement)
        return settlement

    async def get_by_id(self, settlement_id: uuid.UUID) -> Optional[Settlement]:
        result = await self.db.execute(select(Settlement).where(Settlement.id == settlement_id))
        return result.scalar_one_or_none()

    async def get_by_deal(self, deal_id: uuid.UUID) -> Optional[Settlement]:
        result = await self.db.execute(select(Settlement).where(Settlement.deal_id == deal_id))
        return result.scalar_one_or_none()

    async def get_all(self, offset: int = 0, limit: int = 20) -> List[Settlement]:
        result = await self.db.execute(
            select(Settlement).offset(offset).limit(limit).order_by(Settlement.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, settlement: Settlement) -> Settlement:
        await self.db.flush()
        await self.db.refresh(settlement)
        return settlement
