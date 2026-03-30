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
    from sqlalchemy import select, func
    from app.modules.bids.models import Bid
    from app.shared.enums import BidStatus
    from datetime import datetime, timedelta, timezone
    import calendar

    investor_id = uuid.UUID(current_user["user_id"])

    # Determine date window
    now = datetime.now(timezone.utc)
    if range == "Last 7 Days":
        since = now - timedelta(days=7)
    elif range == "Last 90 Days":
        since = now - timedelta(days=90)
    elif range == "This Year":
        since = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    elif range == "All Time":
        since = datetime(2000, 1, 1, tzinfo=timezone.utc)
    else:  # Last 30 Days default
        since = now - timedelta(days=30)

    # Case Volume Trend: count bids per month over last 6 months
    volume_data = []
    for i in range(5, -1, -1):
        # Calculate month start/end
        month_date = now - timedelta(days=30 * i)
        month_start = datetime(month_date.year, month_date.month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(month_date.year, month_date.month)[1]
        month_end = datetime(month_date.year, month_date.month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        result = await db.execute(
            select(func.count(Bid.id)).where(
                Bid.bidder_id == investor_id,
                Bid.created_at >= month_start,
                Bid.created_at <= month_end,
            )
        )
        count = result.scalar() or 0
        volume_data.append({"name": month_date.strftime("%b"), "value": count})

    # Revenue Distribution: bid amounts grouped by status
    result = await db.execute(
        select(Bid).where(Bid.bidder_id == investor_id, Bid.created_at >= since)
    )
    all_bids = list(result.scalars().all())

    status_totals = {}
    for bid in all_bids:
        key = bid.status.value
        status_totals[key] = status_totals.get(key, 0) + float(bid.amount)

    total_amount = sum(status_totals.values()) or 1
    color_map = {
        "WON": "#4F46E5",
        "WINNING": "#10B981",
        "OUTBID": "#F59E0B",
        "PENDING": "#6366F1",
        "LOST": "#EF4444",
    }
    distribution = [
        {
            "name": status,
            "value": round((amount / total_amount) * 100),
            "color": color_map.get(status, "#CBD5E1"),
            "amount": amount,
        }
        for status, amount in status_totals.items()
        if amount > 0
    ]

    return {
        "caseVolume": volume_data,
        "revenueDistribution": distribution,
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
