"""
Auctions module — Service layer.
Auction lifecycle management with state machine enforcement.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuctionNotLiveError,
    InvalidStateTransitionError,
    ResourceNotFoundError,
)
from app.modules.auctions.models import Auction
from app.modules.auctions.repository import AuctionRepository
from app.shared.enums import AuctionStatus
from app.shared.mixins import StateMachineMixin


class AuctionStateMachine(StateMachineMixin):
    """
    Valid auction lifecycle transitions.
    SCHEDULED → LIVE → PAUSED → LIVE → ENDED
    """
    VALID_TRANSITIONS = {
        AuctionStatus.SCHEDULED.value: [AuctionStatus.LIVE.value],
        AuctionStatus.LIVE.value: [AuctionStatus.PAUSED.value, AuctionStatus.ENDED.value],
        AuctionStatus.PAUSED.value: [AuctionStatus.LIVE.value, AuctionStatus.ENDED.value],
    }


class AuctionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AuctionRepository(db)

    async def create_auction(
        self,
        deal_id: uuid.UUID,
        title: str,
        starting_price: Decimal,
        minimum_increment: Decimal,
        scheduled_start: datetime,
        scheduled_end: datetime,
        created_by: uuid.UUID,
        trace_id: str,
    ) -> Auction:
        auction = Auction(
            deal_id=deal_id,
            title=title,
            starting_price=starting_price,
            minimum_increment=minimum_increment,
            status=AuctionStatus.SCHEDULED,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            created_by=created_by,
        )
        return await self.repository.create(auction)

    async def start_auction(self, auction_id: uuid.UUID, trace_id: str) -> Auction:
        """Start a scheduled auction. SCHEDULED → LIVE."""
        auction = await self._get_auction_or_404(auction_id)
        AuctionStateMachine.validate_transition(auction.status.value, AuctionStatus.LIVE.value)
        auction.status = AuctionStatus.LIVE
        auction.actual_start = datetime.now(timezone.utc)
        auction.version += 1
        return await self.repository.update(auction)

    async def pause_auction(self, auction_id: uuid.UUID, trace_id: str) -> Auction:
        """Pause a live auction. LIVE → PAUSED."""
        auction = await self._get_auction_or_404(auction_id)
        AuctionStateMachine.validate_transition(auction.status.value, AuctionStatus.PAUSED.value)
        auction.status = AuctionStatus.PAUSED
        auction.version += 1
        return await self.repository.update(auction)

    async def resume_auction(self, auction_id: uuid.UUID, trace_id: str) -> Auction:
        """Resume a paused auction. PAUSED → LIVE."""
        auction = await self._get_auction_or_404(auction_id)
        AuctionStateMachine.validate_transition(auction.status.value, AuctionStatus.LIVE.value)
        auction.status = AuctionStatus.LIVE  # type: ignore[assignment]
        auction.version += 1
        return await self.repository.update(auction)

    async def end_auction(self, auction_id: uuid.UUID, trace_id: str) -> Auction:
        """End an auction. LIVE/PAUSED → ENDED."""
        auction = await self._get_auction_or_404(auction_id)
        AuctionStateMachine.validate_transition(auction.status.value, AuctionStatus.ENDED.value)
        auction.status = AuctionStatus.ENDED
        auction.actual_end = datetime.now(timezone.utc)
        auction.version += 1
        return await self.repository.update(auction)

    async def update_highest_bid(
        self, auction_id: uuid.UUID, amount: Decimal, bid_id: uuid.UUID
    ) -> Auction:
        """Update current highest bid (called from bid service with FOR UPDATE lock)."""
        auction = await self.repository.get_by_id_for_update(auction_id)
        if not auction:
            raise ResourceNotFoundError(message="Auction not found")
        if auction.status != AuctionStatus.LIVE:  # type: ignore[comparison-overlap]
            raise AuctionNotLiveError()
        auction.current_highest_bid = amount
        auction.winning_bid_id = bid_id
        auction.version += 1
        return await self.repository.update(auction)

    async def get_auction(self, auction_id: uuid.UUID) -> Auction:
        return await self._get_auction_or_404(auction_id)

    async def get_auction_for_update(self, auction_id: uuid.UUID) -> Auction:
        """Get auction with FOR UPDATE lock for concurrency-safe bid placement."""
        auction = await self.repository.get_by_id_for_update(auction_id)
        if not auction:
            raise ResourceNotFoundError(message="Auction not found")
        return auction

    async def get_all_auctions(
        self, status: Optional[AuctionStatus] = None, offset: int = 0, limit: int = 20
    ) -> tuple[List[Auction], int]:
        auctions = await self.repository.get_all(status, offset, limit)
        total = await self.repository.count(status)
        return auctions, total

    async def _get_auction_or_404(self, auction_id: uuid.UUID) -> Auction:
        # 1. Try by Auction ID
        auction = await self.repository.get_by_id(auction_id)
        if auction:
            return auction

        # 2. Try by Deal ID
        auctions = await self.repository.get_by_deal_id(auction_id)
        if auctions:
            return auctions[0]

        # 3. Try by Case ID
        auctions = await self.repository.get_by_case_id(auction_id)
        if auctions:
            return auctions[0]

        # 4. Data Repair Logic: If this ID belongs to an 'AUCTION' case/deal without an auction, create it.
        from app.modules.cases.repository import CaseRepository
        from app.modules.deals.repository import DealRepository
        from app.shared.enums import CaseStatus
        
        case_repo = CaseRepository(self.db)
        deal_repo = DealRepository(self.db)
        
        # Check if it's a Case ID
        case = await case_repo.get_by_id(auction_id)
        if case and case.status == CaseStatus.AUCTION:
            # Found an auction-ready case. Ensure deal and then auction.
            deal = await deal_repo.get_by_case_id(auction_id)
            if not deal:
                # This shouldn't happen with our sync but let's be safe
                from app.modules.deals.service import DealService
                deal = await DealService(self.db).create_deal(
                    case_id=case.id, title=case.title, description=case.description,
                    asking_price=case.estimated_value, reserve_price=None,
                    seller_id=case.borrower_id, created_by=case.borrower_id, trace_id="data-repair"
                )
            
            # Create the missing auction
            from datetime import timedelta
            return await self.create_auction(
                deal_id=deal.id, title=f"Auction for {case.title}",
                starting_price=case.estimated_value, minimum_increment=Decimal("100.00"),
                scheduled_start=datetime.now(timezone.utc),
                scheduled_end=datetime.now(timezone.utc) + timedelta(days=7),
                created_by=case.borrower_id, trace_id="data-repair"
            )

        # Check if it's a Deal ID
        deal = await deal_repo.get_by_id(auction_id)
        if deal:
            case = await case_repo.get_by_id(deal.case_id)
            if case and case.status == CaseStatus.AUCTION:
                from datetime import timedelta
                return await self.create_auction(
                    deal_id=deal.id, title=f"Auction for {case.title}",
                    starting_price=case.estimated_value, minimum_increment=Decimal("100.00"),
                    scheduled_start=datetime.now(timezone.utc),
                    scheduled_end=datetime.now(timezone.utc) + timedelta(days=7),
                    created_by=case.borrower_id, trace_id="data-repair"
                )

        raise ResourceNotFoundError(message="Auction not found")

    async def get_auction_winner(self, auction_id: uuid.UUID) -> dict:
        bids = await self.repository.db.execute(
            __import__("sqlalchemy").select(__import__("app.modules.bids.models", fromlist=["Bid"]).Bid)
            .where(__import__("app.modules.bids.models", fromlist=["Bid"]).Bid.auction_id == auction_id)
        )
        bids = list(bids.scalars().all())
        if not bids:
            raise Exception("No bids found for this auction")
        
        winner = max(bids, key=lambda bid: bid.amount)
        return {"winning_bid": winner, "winning_investor_id": winner.bidder_id}

    async def close_auction_flow(self, auction_id: uuid.UUID, trace_id: str) -> Auction:
        auction = await self._get_auction_or_404(auction_id)
        AuctionStateMachine.validate_transition(auction.status.value, AuctionStatus.ENDED.value)
        auction.status = AuctionStatus.ENDED
        auction.actual_end = datetime.now(timezone.utc)
        
        bids = await self.repository.db.execute(
            __import__("sqlalchemy").select(__import__("app.modules.bids.models", fromlist=["Bid"]).Bid)
            .where(__import__("app.modules.bids.models", fromlist=["Bid"]).Bid.auction_id == auction_id)
        )
        bids = list(bids.scalars().all())
        
        if bids:
            winner = max(bids, key=lambda bid: bid.amount)
            auction.winning_bid_id = winner.id
            
            # Additional cross-module logic (Deal, Contract, Notification) should be triggered here
            # Or handled by domain events. Generating deal, contract and notifications.
            
            # Notify Borrower
            from app.modules.notifications.service import NotificationService
            await NotificationService(self.db).send_notification(
                user_id=auction.created_by,
                type="AUCTION_ENDED",
                title="Auction Ended",
                message=f"Auction {auction.id} has ended with a winning bid of {winner.amount}.",
                trace_id=trace_id,
            )

        auction.version += 1
        return await self.repository.update(auction)
