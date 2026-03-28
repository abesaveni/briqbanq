"""Escrow module — Repository."""
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.escrow.models import Escrow
from app.shared.enums import EscrowStatus

class EscrowRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, escrow: Escrow) -> Escrow:
        self.db.add(escrow)
        await self.db.flush()
        await self.db.refresh(escrow)
        return escrow

    async def get_by_id(self, escrow_id: uuid.UUID) -> Optional[Escrow]:
        result = await self.db.execute(select(Escrow).where(Escrow.id == escrow_id))
        return result.scalar_one_or_none()

    async def get_by_deal(self, deal_id: uuid.UUID) -> List[Escrow]:
        result = await self.db.execute(
            select(Escrow).where(Escrow.deal_id == deal_id).order_by(Escrow.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: uuid.UUID) -> List[Escrow]:
        from sqlalchemy import or_
        result = await self.db.execute(
            select(Escrow).where(or_(Escrow.payer_id == user_id, Escrow.payee_id == user_id)).order_by(Escrow.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def get_by_payer(self, user_id: uuid.UUID) -> List[Escrow]:
        result = await self.db.execute(
            select(Escrow).where(Escrow.payer_id == user_id).order_by(Escrow.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, escrow: Escrow) -> Escrow:
        await self.db.flush()
        await self.db.refresh(escrow)
        return escrow
