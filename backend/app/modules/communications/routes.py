"""Communications module — FastAPI routes (DB-backed)."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_db
from app.modules.communications.models import (
    CommunicationTemplate,
    CommunicationCampaign,
    CommunicationSegment,
)

router = APIRouter(prefix="/communications", tags=["Communications"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    title: str
    desc: Optional[str] = None
    tag: str = "Marketing"


class CampaignCreate(BaseModel):
    title: str
    status: str = "draft"
    recipients: int = 0
    type: Optional[str] = None
    date: Optional[str] = None
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None


class SegmentCreate(BaseModel):
    title: str
    desc: Optional[str] = None
    criteria: Optional[str] = None
    count: int = 0


# ── Seed helper ───────────────────────────────────────────────────────────────

async def _seed_if_empty(db: AsyncSession):
    """Seed initial data — idempotent, checks by title to prevent duplicates."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    existing_titles = set(
        (await db.execute(select(CommunicationTemplate.title))).scalars().all()
    )
    seed_templates = [
        ("Welcome Email", "Welcome to BrickBanq! Get started with your account.", "Onboarding", 247),
        ("Monthly Newsletter", "Your Monthly Market Update — property insights and case highlights.", "Marketing", 1523),
        ("Case Update Notification", "Update on Your Case — status change and next steps.", "Transactional", 892),
        ("Payment Reminder", "Payment Due Reminder — please action before the due date.", "Billing", 456),
        ("Document Request", "Action Required: Document Submission needed for your case.", "Operations", 678),
    ]
    for title, desc, tag, used in seed_templates:
        if title not in existing_titles:
            db.add(CommunicationTemplate(title=title, desc=desc, tag=tag, used=used))

    existing_camps = set(
        (await db.execute(select(CommunicationCampaign.title))).scalars().all()
    )
    seed_campaigns = [
        # open_rate/click_rate left NULL — only real sent campaigns should have these
        ("Q1 2026 Investor Update", "sent", 247, "Monthly Newsletter", "2026-01-15"),
        ("New Property Listings Alert", "scheduled", 156, "Case Update Notification", "2026-03-28"),
        ("Payment Reminder Batch", "draft", 89, "Payment Reminder", None),
        ("Document Collection Drive", "sending", 345, "Document Request", None),
    ]
    for title, status, recipients, type_, date in seed_campaigns:
        if title not in existing_camps:
            db.add(CommunicationCampaign(title=title, status=status, recipients=recipients, type=type_, date=date))

    existing_segs = set(
        (await db.execute(select(CommunicationSegment.title))).scalars().all()
    )
    seed_segments = [
        ("Active Investors", 247, "Investors with active bids or purchases", "Role: Investor, Status: Active, Last Activity: < 30 days"),
        ("High-Value Lenders", 34, "Lenders with 5+ cases valued over $1M", "Role: Lender, Case Value: >$1M, Case Count: >=5"),
        ("Pending KYC Users", 89, "Users who haven't completed KYC verification", "KYC Status: Pending, Registration: <14 days"),
        ("Lawyers - Active Cases", 23, "Lawyers with assigned cases requiring review", "Role: Lawyer, Pending Reviews: >0"),
        ("Dormant Users", 156, "Users with no activity in 90+ days", "Last Activity: >90 days, Status: Active"),
    ]
    for title, count, desc, criteria in seed_segments:
        if title not in existing_segs:
            db.add(CommunicationSegment(title=title, count=count, desc=desc, criteria=criteria))

    await db.commit()


def _tmpl_to_dict(t: CommunicationTemplate) -> dict:
    return {"id": str(t.id), "title": t.title, "desc": t.desc or "", "tag": t.tag, "used": t.used, "modified": t.updated_at.strftime("%Y-%m-%d") if t.updated_at else ""}


def _camp_to_dict(c: CommunicationCampaign) -> dict:
    d = {"id": str(c.id), "title": c.title, "name": c.title, "status": c.status, "recipients": c.recipients, "type": c.type or "", "category": c.type or "", "date": c.date or ""}
    if c.open_rate is not None:
        d["openRate"] = c.open_rate
    if c.click_rate is not None:
        d["clickRate"] = c.click_rate
    return d


def _seg_to_dict(s: CommunicationSegment) -> dict:
    colors = ["bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-purple-50", "bg-rose-50"]
    text_colors = ["text-blue-600", "text-emerald-600", "text-amber-600", "text-purple-600", "text-rose-600"]
    idx = hash(str(s.id)) % 5
    return {"id": str(s.id), "title": s.title, "count": s.count, "desc": s.desc or "", "criteria": s.criteria or "", "bg": colors[idx], "color": text_colors[idx]}


# ── Templates ─────────────────────────────────────────────────────────────────

@router.get("/templates")
async def get_templates(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    result = await db.execute(select(CommunicationTemplate).order_by(CommunicationTemplate.created_at.desc()))
    return [_tmpl_to_dict(t) for t in result.scalars().all()]


@router.post("/templates", status_code=201)
async def create_template(body: TemplateCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tmpl = CommunicationTemplate(title=body.title, desc=body.desc, tag=body.tag, used=0)
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return _tmpl_to_dict(tmpl)


@router.delete("/templates/{template_id}", status_code=200)
async def delete_template(template_id: uuid.UUID, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(CommunicationTemplate).where(CommunicationTemplate.id == template_id))
    await db.commit()
    return {"message": "Deleted"}


# ── Campaigns ─────────────────────────────────────────────────────────────────

@router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    result = await db.execute(select(CommunicationCampaign).order_by(CommunicationCampaign.created_at.desc()))
    return [_camp_to_dict(c) for c in result.scalars().all()]


@router.post("/campaigns", status_code=201)
async def create_campaign(body: CampaignCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import date
    camp = CommunicationCampaign(
        title=body.title, status=body.status, recipients=body.recipients,
        type=body.type, date=body.date or str(date.today()),
        open_rate=body.open_rate, click_rate=body.click_rate,
    )
    db.add(camp)
    await db.commit()
    await db.refresh(camp)
    return _camp_to_dict(camp)


@router.delete("/campaigns/{campaign_id}", status_code=200)
async def delete_campaign(campaign_id: uuid.UUID, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(CommunicationCampaign).where(CommunicationCampaign.id == campaign_id))
    await db.commit()
    return {"message": "Deleted"}


# ── Segments ──────────────────────────────────────────────────────────────────

@router.get("/segments")
async def get_segments(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    result = await db.execute(select(CommunicationSegment).order_by(CommunicationSegment.created_at.desc()))
    return [_seg_to_dict(s) for s in result.scalars().all()]


@router.post("/segments", status_code=201)
async def create_segment(body: SegmentCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    seg = CommunicationSegment(title=body.title, desc=body.desc, criteria=body.criteria, count=body.count)
    db.add(seg)
    await db.commit()
    await db.refresh(seg)
    return _seg_to_dict(seg)


@router.delete("/segments/{segment_id}", status_code=200)
async def delete_segment(segment_id: uuid.UUID, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(CommunicationSegment).where(CommunicationSegment.id == segment_id))
    await db.commit()
    return {"message": "Deleted"}


# ── Analytics (computed from real data) ───────────────────────────────────────

@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)

    total_sent = await db.scalar(
        select(func.coalesce(func.sum(CommunicationCampaign.recipients), 0))
        .where(CommunicationCampaign.status == "sent")
    ) or 0

    avg_open = await db.scalar(
        select(func.avg(CommunicationCampaign.open_rate))
        .where(CommunicationCampaign.status == "sent")
        .where(CommunicationCampaign.open_rate.isnot(None))
    )

    avg_click = await db.scalar(
        select(func.avg(CommunicationCampaign.click_rate))
        .where(CommunicationCampaign.status == "sent")
        .where(CommunicationCampaign.click_rate.isnot(None))
    )

    total_campaigns = await db.scalar(select(func.count()).select_from(CommunicationCampaign)) or 0
    total_templates = await db.scalar(select(func.count()).select_from(CommunicationTemplate)) or 0

    # Top templates by usage — normalize relative to highest usage
    top_tmpl_result = await db.execute(
        select(CommunicationTemplate).order_by(CommunicationTemplate.used.desc()).limit(5)
    )
    top_list = top_tmpl_result.scalars().all()
    max_used = max((t.used for t in top_list), default=1) or 1
    top_templates = [{"name": t.title, "performance": round((t.used / max_used) * 100), "used": t.used} for t in top_list]

    return {
        "totalSent": int(total_sent),
        "avgOpenRate": round(avg_open, 1) if avg_open is not None else None,
        "avgClickRate": round(avg_click, 1) if avg_click is not None else None,
        "totalCampaigns": total_campaigns,
        "totalTemplates": total_templates,
        "topTemplates": top_templates,
    }
