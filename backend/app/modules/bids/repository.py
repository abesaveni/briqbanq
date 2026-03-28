"""Bids module — Repository layer."""
import uuid
from typing import List, Optional
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.bids.models import Bid
from app.shared.enums import BidStatus


class BidRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, bid: Bid) -> Bid:
        self.db.add(bid)
        await self.db.flush()
        # Reload with bidder eagerly to ensure bidder_name is available
        result = await self.db.execute(
            select(Bid).options(selectinload(Bid.bidder)).where(Bid.id == bid.id)
        )
        return result.scalar_one()

    async def get_by_id(self, bid_id: uuid.UUID) -> Optional[Bid]:
        result = await self.db.execute(
            select(Bid).options(selectinload(Bid.bidder)).where(Bid.id == bid_id)
        )
        return result.scalar_one_or_none()

    async def get_highest_bid(self, auction_id: uuid.UUID) -> Optional[Bid]:
        result = await self.db.execute(
            select(Bid)
            .where(Bid.auction_id == auction_id, Bid.status.in_([BidStatus.ACTIVE, BidStatus.WINNING]))
            .order_by(Bid.amount.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_auction_bids(self, auction_id: uuid.UUID) -> List[Bid]:
        result = await self.db.execute(
            select(Bid)
            .options(selectinload(Bid.bidder))
            .where(Bid.auction_id == auction_id)
            .order_by(Bid.amount.desc())
        )
        return list(result.scalars().all())

    async def get_user_bids(self, bidder_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Bid]:
        result = await self.db.execute(
            select(Bid)
            .options(selectinload(Bid.bidder))
            .where(Bid.bidder_id == bidder_id)
            .offset(offset).limit(limit).order_by(Bid.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_winning_bids(self, auction_id: uuid.UUID, exclude_bid_id: uuid.UUID) -> List[Bid]:
        """Get all currently WINNING bids for an auction (for outbid notifications)."""
        result = await self.db.execute(
            select(Bid)
            .where(
                Bid.auction_id == auction_id,
                Bid.id != exclude_bid_id,
                Bid.status.in_([BidStatus.ACTIVE, BidStatus.WINNING]),
            )
        )
        return list(result.scalars().all())

    async def mark_outbid(self, auction_id: uuid.UUID, exclude_bid_id: uuid.UUID) -> None:
        """Mark all previous active/winning bids for an auction as OUTBID."""
        await self.db.execute(
            update(Bid)
            .where(
                Bid.auction_id == auction_id,
                Bid.id != exclude_bid_id,
                Bid.status.in_([BidStatus.ACTIVE, BidStatus.WINNING]),
            )
            .values(status=BidStatus.OUTBID)
        )
        await self.db.flush()

    async def update(self, bid: Bid) -> Bid:
        await self.db.flush()
        await self.db.refresh(bid)
        return bid

    async def count_auction_bids(self, auction_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Bid.id)).where(Bid.auction_id == auction_id)
        )
        return result.scalar() or 0
