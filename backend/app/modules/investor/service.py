"""Investor module service."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.bids.repository import BidRepository
from app.shared.enums import BidStatus

class InvestorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.bid_repo = BidRepository(db)

    async def get_portfolio(self, investor_id: uuid.UUID) -> dict:
        bids = await self.bid_repo.get_user_bids(investor_id)
        active_investments = len([b for b in bids if b.status in [BidStatus.WINNING, BidStatus.WON]])
        # Mocking ROI and total returns
        return {
            "active_investments": active_investments,
            "roi": 12.5,
            "funded_deals": active_investments,
            "investment_returns": 5000.0,
        }
