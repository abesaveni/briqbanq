"""Bids module — FastAPI routes."""
import uuid
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.bids.policies import BidPolicy
from app.modules.bids.schemas import BidPlaceRequest, BidResponse, BidListResponse, BidValidationRequest
from app.modules.bids.service import BidService

router = APIRouter(prefix="/bids", tags=["Bids"])

@router.post("/validate")
async def validate_bid_endpoint(
    request: BidValidationRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = BidService(db)
    is_valid = await service.validate_bid(
        investor_id=uuid.UUID(current_user["user_id"]),
        auction_id=request.auction_id,
        bid_amount=request.amount
    )
    return {"valid": is_valid}


@router.post("/place", response_model=BidResponse, status_code=201)
async def place_bid(
    request: BidPlaceRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Place a bid on a live auction (investors, lenders, lawyers, admins)."""
    BidPolicy.can_place_bid(current_user)
    service = BidService(db)
    bid = await service.place_bid(
        auction_id=request.auction_id,
        bidder_id=uuid.UUID(current_user["user_id"]),
        amount=request.amount,
        trace_id=trace_id,
    )
    from app.modules.audit.service import AuditService
    actor_role = (current_user.get("roles") or ["INVESTOR"])[0].upper()
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role=actor_role,
        entity_type="bid", entity_id=str(bid.id),
        action="PLACE_BID",
        before_state=None,
        after_state={"auction_id": str(request.auction_id), "amount": str(request.amount), "status": "WINNING"},
        trace_id=trace_id,
    )
    return bid


@router.get("/auction/{auction_id}", response_model=list[BidResponse])
async def get_auction_bids(
    auction_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    service = BidService(db)
    return await service.get_auction_bids(auction_id)


@router.get("/by-case/{case_id}", response_model=list[BidResponse])
async def get_bids_by_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all bids for the auction linked to a case (for borrower's auction room)."""
    from app.modules.auctions.repository import AuctionRepository
    auction_repo = AuctionRepository(db)
    auctions = await auction_repo.get_by_case_id(case_id)
    if not auctions:
        return []
    service = BidService(db)
    return await service.get_auction_bids(auctions[0].id)


@router.get("/my-bids")
async def get_my_bids(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Return bids with enriched auction + case data for My Bids page."""
    from sqlalchemy import select
    from app.modules.auctions.models import Auction as AuctionModel
    from app.modules.deals.models import Deal
    from app.modules.cases.models import Case

    service = BidService(db)
    offset = (page - 1) * page_size
    bids = await service.get_user_bids(uuid.UUID(current_user["user_id"]), offset, page_size)

    # Enrich each bid with auction + case info
    enriched = []
    for bid in bids:
        auction_row = await db.execute(
            select(AuctionModel).where(AuctionModel.id == bid.auction_id)
        )
        auction = auction_row.scalar_one_or_none()
        auction_data = None
        if auction:
            # Resolve case via deal
            case_data = None
            deal_row = await db.execute(select(Deal).where(Deal.id == auction.deal_id))
            deal = deal_row.scalar_one_or_none()
            if deal:
                case_row = await db.execute(select(Case).where(Case.id == deal.case_id))
                case = case_row.scalar_one_or_none()
                if case:
                    case_data = {
                        "id": str(case.id),
                        "case_number": case.case_number,
                        "property_address": case.property_address,
                    }
            auction_data = {
                "id": str(auction.id),
                "title": auction.title,
                "status": auction.status.value if hasattr(auction.status, "value") else str(auction.status),
                "current_highest_bid": float(auction.current_highest_bid) if auction.current_highest_bid else None,
                "scheduled_end": auction.scheduled_end.isoformat() if auction.scheduled_end else None,
                "case_id": case_data["id"] if case_data else None,
                "case_number": case_data["case_number"] if case_data else None,
                "property_address": case_data["property_address"] if case_data else auction.title,
            }
        enriched.append({
            "id": str(bid.id),
            "auction_id": str(bid.auction_id),
            "bidder_id": str(bid.bidder_id),
            "amount": float(bid.amount),
            "status": bid.status.value if hasattr(bid.status, "value") else str(bid.status),
            "created_at": bid.created_at.isoformat(),
            "updated_at": bid.updated_at.isoformat(),
            "version": bid.version,
            "auction": auction_data,
            "auction_status": auction_data["status"] if auction_data else None,
        })
    return enriched


@router.post("/approve/{bid_id}", response_model=BidResponse)
async def approve_bid(
    bid_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Admin accepts the winning bid — closes auction and sends all notifications."""
    roles = [r.upper() for r in current_user.get("roles", [])]
    if "ADMIN" not in roles:
        from app.core.exceptions import AuthorizationError
        raise AuthorizationError(message="Only Admins can accept bids.")
    service = BidService(db)
    bid = await service.approve_bid(
        bid_id=bid_id,
        borrower_id=uuid.UUID(current_user["user_id"]),
        is_admin=True,
    )
    from app.modules.audit.service import AuditService
    actor_role = "ADMIN"
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role=actor_role,
        entity_type="bid", entity_id=str(bid_id),
        action="APPROVE_BID",
        before_state=None,
        after_state={"status": "WON"},
        trace_id=trace_id,
    )
    return bid
