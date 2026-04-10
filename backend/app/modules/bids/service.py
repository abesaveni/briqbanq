"""
Bids module — Service layer.
Concurrency-safe bid placement with SELECT FOR UPDATE.
Only investors can bid. Bid must exceed current highest bid.
"""
import uuid
from decimal import Decimal
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuctionNotLiveError,
    BidTooLowError,
    ResourceNotFoundError,
)
from app.modules.auctions.service import AuctionService
from app.modules.bids.models import Bid
from app.modules.bids.repository import BidRepository
from app.shared.enums import AuctionStatus, BidStatus


class BidService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = BidRepository(db)

    async def place_bid(
        self,
        auction_id: uuid.UUID,
        bidder_id: uuid.UUID,
        amount: Decimal,
        trace_id: str,
    ) -> Bid:
        """
        Place a bid on a live auction.
        Uses SELECT FOR UPDATE on the auction row for concurrency safety.
        - Auction must be LIVE
        - Bid must exceed current highest bid
        - Previous bids marked as OUTBID
        - Single winner enforced
        """
        auction_service = AuctionService(self.db)

        # Lock the auction row for concurrent-safe bidding
        auction = await auction_service.get_auction_for_update(auction_id)

        # Auction must be LIVE
        if auction.status != AuctionStatus.LIVE:
            raise AuctionNotLiveError()

        # Block case creator from bidding on their own case
        try:
            from sqlalchemy import select
            from app.modules.deals.models import Deal as DealModel
            from app.modules.cases.models import Case as CaseModel
            from app.core.exceptions import AuthorizationError
            deal_row = await self.db.execute(select(DealModel).where(DealModel.id == auction.deal_id))
            _deal = deal_row.scalar_one_or_none()
            if _deal:
                case_row = await self.db.execute(select(CaseModel).where(CaseModel.id == _deal.case_id))
                _case = case_row.scalar_one_or_none()
                if _case and _case.borrower_id == bidder_id:
                    raise AuthorizationError(message="You cannot bid on a case you submitted.")
        except AuthorizationError:
            raise
        except Exception:
            pass  # If lookup fails, don't block bid placement

        # Bid must exceed current highest or starting price
        minimum_bid = auction.current_highest_bid or auction.starting_price
        if auction.current_highest_bid:
            minimum_bid = auction.current_highest_bid + auction.minimum_increment

        if amount < minimum_bid:
            raise BidTooLowError(
                message=f"Bid must be at least {minimum_bid}. Current highest: {auction.current_highest_bid or 'None'}"
            )

        # Create the bid
        bid = Bid(
            auction_id=auction_id,
            bidder_id=bidder_id,
            amount=amount,
            status=BidStatus.WINNING,
        )
        bid = await self.repository.create(bid)

        # Get current winning bids before marking outbid (for notifications)
        outbid_records = await self.repository.get_winning_bids(auction_id, exclude_bid_id=bid.id)

        # Mark all previous active/winning bids as OUTBID
        await self.repository.mark_outbid(auction_id, exclude_bid_id=bid.id)

        # Update auction's current highest bid
        await auction_service.update_highest_bid(auction_id, amount, bid.id)

        # Send notifications and emails (fire-and-forget, never block bid placement)
        try:
            from sqlalchemy import select
            from app.modules.identity.models import User
            from app.modules.deals.repository import DealRepository
            from app.modules.cases.repository import CaseRepository
            from app.modules.notifications.service import NotificationService
            from app.infrastructure.email_service import EmailService

            # Resolve bidder, case, and borrower for notification context
            result = await self.db.execute(select(User).where(User.id == bidder_id))
            bidder = result.scalar_one_or_none()

            deal_repo = DealRepository(self.db)
            deal = await deal_repo.get_by_id(auction.deal_id)
            case = None
            borrower = None
            if deal:
                case_repo = CaseRepository(self.db)
                case = await case_repo.get_by_id(deal.case_id)
                if case:
                    result = await self.db.execute(select(User).where(User.id == case.borrower_id))
                    borrower = result.scalar_one_or_none()

            bid_amount_fmt = f"A${float(amount):,.0f}"
            case_title = case.title if case else str(auction_id)[:8]
            property_address = case.property_address if case else ""
            total_bids = await self.repository.count_auction_bids(auction_id)

            notif_service = NotificationService(self.db)

            # 1. Confirm to bidder
            if bidder:
                await notif_service.create_notification(
                    user_id=bidder_id,
                    title="Bid Placed Successfully",
                    message=f"Your bid of {bid_amount_fmt} on '{case_title}' has been placed.",
                    entity_type="auction",
                    entity_id=str(auction_id),
                    trace_id=trace_id,
                )
                await EmailService.send_bid_placed_confirmation(
                    to_email=bidder.email,
                    bidder_name=f"{bidder.first_name} {bidder.last_name}".strip() or bidder.email,
                    case_title=case_title,
                    bid_amount=bid_amount_fmt,
                    property_address=property_address,
                )

            # 2. Notify borrower of new bid
            if borrower and case:
                await notif_service.create_notification(
                    user_id=case.borrower_id,
                    title="New Bid Received",
                    message=f"A new bid of {bid_amount_fmt} has been placed on your case '{case_title}'.",
                    entity_type="case",
                    entity_id=str(case.id),
                    trace_id=trace_id,
                )
                await EmailService.send_new_bid_to_borrower(
                    to_email=borrower.email,
                    borrower_name=f"{borrower.first_name} {borrower.last_name}".strip() or borrower.email,
                    case_title=case_title,
                    bid_amount=bid_amount_fmt,
                    bidder_count=total_bids,
                )

            # 3. Notify outbid participants
            for outbid in (outbid_records or []):
                result = await self.db.execute(select(User).where(User.id == outbid.bidder_id))
                outbid_user = result.scalar_one_or_none()
                if outbid_user:
                    await notif_service.notify_bid_outbid(
                        user_id=outbid.bidder_id,
                        auction_title=case_title,
                        new_amount=bid_amount_fmt,
                        trace_id=trace_id,
                    )
                    await EmailService.send_bid_outbid_notification(
                        to_email=outbid_user.email,
                        bidder_name=f"{outbid_user.first_name} {outbid_user.last_name}".strip() or outbid_user.email,
                        case_number=case.case_number or str(case.id)[:8].upper() if case else "",
                        property_address=property_address,
                        your_bid=f"A${float(outbid.amount):,.0f}",
                        winning_amount=bid_amount_fmt,
                    )
        except Exception as e:
            import structlog
            structlog.get_logger().warning("bid_notification_failed", error=str(e))

        return bid

    async def get_auction_bids(self, auction_id: uuid.UUID) -> List[Bid]:
        return await self.repository.get_auction_bids(auction_id)

    async def get_user_bids(
        self, bidder_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> List[Bid]:
        return await self.repository.get_user_bids(bidder_id, offset, limit)

    async def get_winning_bid(self, auction_id: uuid.UUID) -> Bid:
        bid = await self.repository.get_highest_bid(auction_id)
        if not bid:
            raise ResourceNotFoundError(message="No bids found for this auction")
        return bid

    async def mark_bid_won(self, bid_id: uuid.UUID) -> Bid:
        bid = await self.repository.get_by_id(bid_id)
        if not bid:
            raise ResourceNotFoundError(message="Bid not found")
        bid.status = BidStatus.WON
        bid.version += 1
        return await self.repository.update(bid)

    async def mark_bid_defaulted(self, bid_id: uuid.UUID) -> Bid:
        """Mark a winning bid as defaulted — triggers relist."""
        bid = await self.repository.get_by_id(bid_id)
        if not bid:
            raise ResourceNotFoundError(message="Bid not found")
        bid.status = BidStatus.DEFAULTED
        bid.version += 1
        return await self.repository.update(bid)

    async def approve_bid(self, bid_id: uuid.UUID, borrower_id: uuid.UUID, is_admin: bool = False) -> "Bid":
        """
        Borrower approves the winning bid.
        - Marks the bid as WON
        - Ends the auction
        - Closes the case
        - Sends email notifications to all parties
        """
        from sqlalchemy import select
        from app.modules.identity.models import User
        from app.modules.auctions.repository import AuctionRepository
        from app.modules.cases.repository import CaseRepository
        from app.modules.cases.models import Case
        from app.shared.enums import CaseStatus
        from app.infrastructure.email_service import EmailService
        from datetime import datetime, timezone

        # 1. Get and validate the bid
        bid = await self.repository.get_by_id(bid_id)
        if not bid:
            from app.core.exceptions import ResourceNotFoundError
            raise ResourceNotFoundError(message="Bid not found")

        # 2. Get auction
        auction_repo = AuctionRepository(self.db)
        auction = await auction_repo.get_by_id(bid.auction_id)
        if not auction:
            from app.core.exceptions import ResourceNotFoundError
            raise ResourceNotFoundError(message="Auction not found")

        # 3. Verify borrower owns the case tied to this auction
        from app.modules.deals.repository import DealRepository
        deal_repo = DealRepository(self.db)
        deal = await deal_repo.get_by_id(auction.deal_id)
        if not deal:
            from app.core.exceptions import ResourceNotFoundError
            raise ResourceNotFoundError(message="Deal not found")

        case_repo = CaseRepository(self.db)
        case = await case_repo.get_by_id(deal.case_id)
        if not case:
            from app.core.exceptions import ResourceNotFoundError
            raise ResourceNotFoundError(message="Case not found")

        if case.borrower_id != borrower_id and not is_admin:
            from app.core.exceptions import AuthorizationError
            raise AuthorizationError(message="Only the case borrower or an admin can approve bids")

        # 4. Mark bid as WON
        bid.status = BidStatus.WON
        bid.version += 1
        await self.repository.update(bid)

        # 5. Mark all other bids as OUTBID (finalize)
        from sqlalchemy import update as sa_update
        from app.modules.bids.models import Bid as BidModel
        await self.db.execute(
            sa_update(BidModel)
            .where(BidModel.auction_id == bid.auction_id, BidModel.id != bid_id)
            .values(status=BidStatus.OUTBID)
        )
        await self.db.flush()

        # 6. End the auction
        auction.status = AuctionStatus.ENDED
        auction.actual_end = datetime.now(timezone.utc)
        auction.version += 1
        await auction_repo.update(auction)

        # 7. Close the case
        case.status = CaseStatus.CLOSED
        case.version += 1
        await case_repo.update(case)

        # 8. Collect parties for email
        try:
            # Get bidder (winner)
            result = await self.db.execute(select(User).where(User.id == bid.bidder_id))
            winning_bidder = result.scalar_one_or_none()

            # Get borrower
            result = await self.db.execute(select(User).where(User.id == borrower_id))
            borrower = result.scalar_one_or_none()

            # Get all admin users
            from app.modules.identity.repository import UserRepository
            from app.shared.enums import RoleType
            user_repo = UserRepository(self.db)
            admin_users = await user_repo.get_users_by_role(RoleType.ADMIN)

            case_number = case.case_number or str(case.id)[:8].upper()
            winning_amount = f"A${float(bid.amount):,.0f}"
            winning_name = winning_bidder.full_name if winning_bidder else "Winning Bidder"
            borrower_name = borrower.full_name if borrower else "Borrower"

            # Email borrower
            if borrower:
                await EmailService.send_bid_closed_to_borrower(
                    to_email=borrower.email,
                    borrower_name=borrower_name,
                    case_number=case_number,
                    property_address=case.property_address,
                    winning_bidder_name=winning_name,
                    winning_amount=winning_amount,
                )

            # Email winning bidder
            if winning_bidder:
                await EmailService.send_bid_won_to_bidder(
                    to_email=winning_bidder.email,
                    bidder_name=winning_name,
                    case_number=case_number,
                    property_address=case.property_address,
                    winning_amount=winning_amount,
                )

            # Email all admins
            for admin in admin_users:
                await EmailService.send_bid_closed_to_admin(
                    to_email=admin.email,
                    case_number=case_number,
                    property_address=case.property_address,
                    winning_bidder_name=winning_name,
                    winning_amount=winning_amount,
                    borrower_name=borrower_name,
                )

            # Email losing bidders
            all_bids = await self.repository.get_auction_bids(bid.auction_id)
            for losing_bid in all_bids:
                if losing_bid.id == bid_id:
                    continue
                result = await self.db.execute(select(User).where(User.id == losing_bid.bidder_id))
                losing_bidder = result.scalar_one_or_none()
                if losing_bidder:
                    await EmailService.send_bid_outbid_notification(
                        to_email=losing_bidder.email,
                        bidder_name=losing_bidder.full_name,
                        case_number=case_number,
                        property_address=case.property_address,
                        your_bid=f"A${float(losing_bid.amount):,.0f}",
                        winning_amount=winning_amount,
                    )
        except Exception as e:
            import structlog
            structlog.get_logger().error("bid_approval_email_failed", error=str(e))

        return bid

    async def validate_bid(self, investor_id: uuid.UUID, auction_id: uuid.UUID, bid_amount: Decimal) -> bool:
        from app.modules.wallet.service import WalletService
        wallet_service = WalletService(self.db)
        user_wallet = await wallet_service.get_user_wallet(investor_id)
        balance_info = await wallet_service.get_balance(user_wallet.id)
        
        if balance_info["balance"] < bid_amount:
            raise Exception("Insufficient funds")
        
        auction_service = AuctionService(self.db)
        auction = await auction_service.get_auction(auction_id)
        
        minimum_bid = auction.current_highest_bid + auction.minimum_increment if auction.current_highest_bid else auction.starting_price
        
        if bid_amount < minimum_bid:
            raise Exception("Bid too low")
            
        return True
