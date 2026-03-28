"""Investor module routes."""
import uuid
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_db
from app.modules.investor.schemas import PortfolioResponse
from app.modules.investor.service import InvestorService
from sqlalchemy import select

router = APIRouter(prefix="/investor", tags=["Investor"])

@router.get("/my-cases")
async def get_my_investment_cases(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return cases where this investor has placed bids, with case details."""
    from app.modules.bids.models import Bid
    from app.modules.auctions.models import Auction as AuctionModel
    from app.modules.deals.models import Deal
    from app.modules.cases.models import Case
    from app.shared.enums import BidStatus

    investor_id = uuid.UUID(current_user["user_id"])

    # Get all bids by this investor
    bids_result = await db.execute(
        select(Bid).where(Bid.bidder_id == investor_id).order_by(Bid.amount.desc())
    )
    bids = list(bids_result.scalars().all())

    if not bids:
        return []

    # Group bids by auction_id, keep highest bid per auction
    auction_to_bid = {}
    for bid in bids:
        aid = bid.auction_id
        if aid not in auction_to_bid or bid.amount > auction_to_bid[aid].amount:
            auction_to_bid[aid] = bid

    # Join auctions -> deals -> cases
    auction_ids = list(auction_to_bid.keys())
    cases_result = await db.execute(
        select(Case, AuctionModel)
        .join(Deal, Deal.case_id == Case.id)
        .join(AuctionModel, AuctionModel.deal_id == Deal.id)
        .where(AuctionModel.id.in_(auction_ids))
    )
    rows = cases_result.all()

    output = []
    seen_cases = set()
    for row in rows:
        case = row[0]
        auction = row[1]
        if case.id in seen_cases:
            continue
        seen_cases.add(case.id)
        bid = auction_to_bid.get(auction.id)
        meta = case.metadata_json or {}
        images = case.property_images or meta.get("property_images", [])
        output.append({
            "id": str(case.id),
            "case_number": case.case_number,
            "title": case.title or case.property_address,
            "property_address": case.property_address,
            "suburb": meta.get("suburb", ""),
            "state": meta.get("state", ""),
            "postcode": meta.get("postcode", ""),
            "property_type": case.property_type or meta.get("property_type", "House"),
            "status": case.status.value,
            "auction_status": auction.status.value if auction else None,
            "outstanding_debt": float(case.outstanding_debt or 0),
            "estimated_value": float(case.estimated_value or 0),
            "interest_rate": float(case.interest_rate or 0),
            "my_bid": float(bid.amount) if bid else None,
            "bid_status": bid.status.value if bid else None,
            "property_images": images,
            "bedrooms": meta.get("bedrooms", 0),
            "bathrooms": meta.get("bathrooms", 0),
            "parking": meta.get("parking", 0),
            "created_at": case.created_at.isoformat() if case.created_at else None,
        })

    return output


@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = InvestorService(db)
    return await service.get_portfolio(uuid.UUID(current_user["user_id"]))

@router.get("/analytics/summary")
async def get_summary_stats(
    range: str = "Last 30 Days",
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Investor dashboard summary based on real bid data."""
    from sqlalchemy import select
    from app.modules.bids.models import Bid
    from app.shared.enums import BidStatus
    investor_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(Bid).where(Bid.bidder_id == investor_id))
    all_bids = list(result.scalars().all())
    won_bids = [b for b in all_bids if b.status == BidStatus.WON]
    active_bids = [b for b in all_bids if b.status == BidStatus.WINNING]
    total_won = sum(float(b.amount) for b in won_bids)
    avg_value = total_won / len(won_bids) if won_bids else 0
    success_rate = round(len(won_bids) / len(all_bids) * 100) if all_bids else 0
    return {
        "totalCases": len(won_bids),
        "activeCases": len(active_bids),
        "totalRevenue": f"A${total_won:,.0f}",
        "avgCaseValue": f"A${avg_value:,.0f}",
        "totalBids": len(all_bids),
        "successRate": f"{success_rate}%",
        "trends": {
            "totalCases": "+0%",
            "totalRevenue": "+0%",
            "successRate": "+0%"
        }
    }

@router.get("/analytics/charts")
async def get_analytics_charts(
    range: str = "Last 30 Days",
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    return {
        "caseVolume": [],
        "revenueDistribution": []
    }

@router.get("/analytics/activity")
async def get_recent_activity(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Recent bid activity for investor."""
    from sqlalchemy import select
    from app.modules.bids.models import Bid
    investor_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(
        select(Bid).where(Bid.bidder_id == investor_id).order_by(Bid.created_at.desc()).limit(10)
    )
    bids = list(result.scalars().all())
    return [
        {
            "id": str(b.id),
            "type": "bid",
            "amount": float(b.amount),
            "status": b.status.value,
            "auction_id": str(b.auction_id),
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in bids
    ]
