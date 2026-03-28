"""
Auctions module — Repository layer.
"""
import uuid
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auctions.models import Auction
from app.shared.enums import AuctionStatus


class AuctionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, auction: Auction) -> Auction:
        self.db.add(auction)
        await self.db.flush()
        await self.db.refresh(auction)
        return auction

    async def get_by_id(self, auction_id: uuid.UUID) -> Optional[Auction]:
        result = await self.db.execute(select(Auction).where(Auction.id == auction_id))
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, auction_id: uuid.UUID) -> Optional[Auction]:
        """SELECT FOR UPDATE for concurrency-safe bid placement."""
        result = await self.db.execute(
            select(Auction).where(Auction.id == auction_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_deal_id(self, deal_id: uuid.UUID) -> List[Auction]:
        result = await self.db.execute(
            select(Auction).where(Auction.deal_id == deal_id).order_by(Auction.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_case_id(self, case_id: uuid.UUID) -> List[Auction]:
        """Indirect lookup via Deal."""
        from app.modules.deals.models import Deal
        result = await self.db.execute(
            select(Auction)
            .join(Deal, Auction.deal_id == Deal.id)
            .where(Deal.case_id == case_id)
            .order_by(Auction.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all(
        self, status: Optional[AuctionStatus] = None, offset: int = 0, limit: int = 20
    ) -> List[Auction]:
        query = select(Auction)
        if status:
            query = query.where(Auction.status == status)
        query = query.offset(offset).limit(limit).order_by(Auction.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[AuctionStatus] = None) -> int:
        query = select(func.count(Auction.id))
        if status:
            query = query.where(Auction.status == status)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def update(self, auction: Auction) -> Auction:
        await self.db.flush()
        await self.db.refresh(auction)
        return auction
