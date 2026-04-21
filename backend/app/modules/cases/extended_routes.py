"""
Extended case routes — Securities, Parties, LoanMetrics, AuctionMetrics,
InternalNotes, StatusHistory, Draft-save, Duplicate, Archive.

All routes sit under /cases/{case_id}/ prefix.

Key pattern: `db` from Depends(get_db) is already an AsyncSession —
do NOT wrap it in `async with db as session`.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.cases.extended_models import (
    CaseSecurity, CaseParty, CaseLoanMetrics,
    CaseAuctionMetrics, CaseInternalNote, CaseStatusHistory,
)

router = APIRouter(prefix="/cases", tags=["Cases Extended"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_role(current_user: dict, *roles: str):
    """Raise 403 if the current user does not have at least one of the given roles."""
    user_roles = [str(r).upper() for r in (current_user.get("roles") or [])]
    allowed = [r.upper() for r in roles]
    if not any(r in user_roles for r in allowed):
        raise HTTPException(status_code=403, detail=f"Requires one of: {', '.join(allowed)}")


def _uid(val) -> Optional[uuid.UUID]:
    """Safely coerce string to UUID, returning None on failure."""
    if val is None:
        return None
    try:
        return uuid.UUID(str(val))
    except (ValueError, AttributeError):
        return None


def _flt(v) -> Optional[float]:
    return float(v) if v is not None else None


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SecurityIn(BaseModel):
    property_address: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[str] = None
    security_type: Optional[str] = None
    title_holder: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    existing_debt: Optional[Decimal] = None
    priority_position: Optional[str] = None
    mortgage_registered: bool = False
    ppsa_registered: bool = False
    forced_sale_estimate: Optional[Decimal] = None
    equity_buffer: Optional[Decimal] = None
    valuation_date: Optional[datetime] = None
    valuation_provider: Optional[str] = None
    property_condition: Optional[str] = None
    days_on_market: Optional[int] = None
    comparable_sales_summary: Optional[str] = None
    liquidity_rating: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 0


class PartyIn(BaseModel):
    party_type: str = "individual"
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[datetime] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    residential_address: Optional[str] = None
    postal_address: Optional[str] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    annual_income: Optional[Decimal] = None
    tfn: Optional[str] = None
    credit_consent: bool = False
    company_name: Optional[str] = None
    acn: Optional[str] = None
    abn: Optional[str] = None
    company_type: Optional[str] = None
    registered_address: Optional[str] = None
    trading_address: Optional[str] = None
    industry: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    trust_name: Optional[str] = None
    trust_type: Optional[str] = None
    trust_abn: Optional[str] = None
    trust_tfn: Optional[str] = None
    trust_established_date: Optional[datetime] = None
    trustee_type: Optional[str] = None
    appointor: Optional[str] = None
    roles: Optional[List[str]] = None
    directors: Optional[Any] = None
    shareholders: Optional[Any] = None
    trustees: Optional[Any] = None
    beneficiaries: Optional[Any] = None
    sort_order: int = 0


class LoanMetricsIn(BaseModel):
    principal_outstanding: Optional[Decimal] = None
    accrued_interest: Optional[Decimal] = None
    default_interest: Optional[Decimal] = None
    fees: Optional[Decimal] = None
    legal_costs: Optional[Decimal] = None
    total_arrears: Optional[Decimal] = None
    total_payout: Optional[Decimal] = None
    missed_payments: Optional[int] = None
    days_in_arrears: Optional[int] = None
    arrears_start_date: Optional[datetime] = None
    last_payment_date: Optional[datetime] = None
    lvr: Optional[Decimal] = None
    equity_buffer: Optional[Decimal] = None
    forced_sale_estimate: Optional[Decimal] = None
    selling_costs: Optional[Decimal] = None
    holding_costs: Optional[Decimal] = None
    net_recovery_estimate: Optional[Decimal] = None
    lvr_is_manual: bool = False
    forced_sale_is_manual: bool = False
    nccp_subject: bool = False
    borrower_cooperation: Optional[str] = None


class AuctionMetricsIn(BaseModel):
    enforcement_type: Optional[str] = None
    current_stage: Optional[str] = None
    expected_exit_path: Optional[str] = None
    estimated_timeline: Optional[str] = None
    sale_strategy: Optional[str] = None
    refinance_expected: Optional[bool] = None
    recovery_handler: Optional[str] = None
    default_valid: Optional[bool] = None
    default_notice_date: Optional[datetime] = None
    acceleration_triggered: Optional[bool] = None
    enforcement_commenced: Optional[bool] = None
    court_action: Optional[bool] = None
    borrower_dispute: Optional[bool] = None
    injunction_issue: Optional[bool] = None
    registered_position: Optional[str] = None
    registered_on_title: Optional[bool] = None
    other_encumbrances: Optional[str] = None
    competing_lenders: Optional[str] = None
    caveats: Optional[str] = None
    ato_debt_indicator: Optional[bool] = None
    priority_ranking: Optional[str] = None
    investment_structure: Optional[str] = None
    minimum_bid: Optional[Decimal] = None
    ownership_rights: Optional[str] = None
    security_rights: Optional[str] = None
    distribution_mechanics: Optional[str] = None
    scenario_base: Optional[Any] = None
    scenario_conservative: Optional[Any] = None
    scenario_downside: Optional[Any] = None
    risk_flags: Optional[Any] = None


class InternalNoteIn(BaseModel):
    note_type: str = "general"
    content: str
    is_pinned: bool = False


class DraftSaveRequest(BaseModel):
    metadata_json: Optional[Any] = None
    workflow_status: Optional[str] = None
    completion_pct: Optional[int] = None
    step_status: Optional[Any] = None
    title: Optional[str] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    outstanding_debt: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None


# ─── Serialisers ──────────────────────────────────────────────────────────────

def _security_out(s: CaseSecurity) -> dict:
    return {
        "id": str(s.id), "case_id": str(s.case_id),
        "property_address": s.property_address, "suburb": s.suburb,
        "state": s.state, "postcode": s.postcode,
        "property_type": s.property_type, "security_type": s.security_type,
        "title_holder": s.title_holder,
        "estimated_value": _flt(s.estimated_value),
        "existing_debt": _flt(s.existing_debt),
        "priority_position": s.priority_position,
        "mortgage_registered": s.mortgage_registered,
        "ppsa_registered": s.ppsa_registered,
        "forced_sale_estimate": _flt(s.forced_sale_estimate),
        "equity_buffer": _flt(s.equity_buffer),
        "valuation_date": s.valuation_date.isoformat() if s.valuation_date else None,
        "valuation_provider": s.valuation_provider,
        "property_condition": s.property_condition,
        "days_on_market": s.days_on_market,
        "comparable_sales_summary": s.comparable_sales_summary,
        "liquidity_rating": s.liquidity_rating,
        "notes": s.notes, "sort_order": s.sort_order,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
    }


def _party_out(p: CaseParty) -> dict:
    return {
        "id": str(p.id), "case_id": str(p.case_id),
        "party_type": p.party_type,
        "first_name": p.first_name, "last_name": p.last_name,
        "dob": p.dob.isoformat() if p.dob else None,
        "phone": p.phone, "email": p.email,
        "residential_address": p.residential_address,
        "postal_address": p.postal_address,
        "occupation": p.occupation, "employer": p.employer,
        "annual_income": _flt(p.annual_income),
        "tfn": p.tfn, "credit_consent": p.credit_consent,
        "company_name": p.company_name, "acn": p.acn, "abn": p.abn,
        "company_type": p.company_type,
        "registered_address": p.registered_address,
        "trading_address": p.trading_address, "industry": p.industry,
        "contact_person": p.contact_person,
        "contact_phone": p.contact_phone, "contact_email": p.contact_email,
        "trust_name": p.trust_name, "trust_type": p.trust_type,
        "trust_abn": p.trust_abn, "trust_tfn": p.trust_tfn,
        "trust_established_date": p.trust_established_date.isoformat() if p.trust_established_date else None,
        "trustee_type": p.trustee_type, "appointor": p.appointor,
        "roles": p.roles or [],
        "directors": p.directors or [],
        "shareholders": p.shareholders or [],
        "trustees": p.trustees or [],
        "beneficiaries": p.beneficiaries or [],
        "sort_order": p.sort_order,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


def _loan_metrics_out(lm: CaseLoanMetrics) -> dict:
    return {
        "id": str(lm.id), "case_id": str(lm.case_id),
        "principal_outstanding": _flt(lm.principal_outstanding),
        "accrued_interest": _flt(lm.accrued_interest),
        "default_interest": _flt(lm.default_interest),
        "fees": _flt(lm.fees),
        "legal_costs": _flt(lm.legal_costs),
        "total_arrears": _flt(lm.total_arrears),
        "total_payout": _flt(lm.total_payout),
        "missed_payments": lm.missed_payments,
        "days_in_arrears": lm.days_in_arrears,
        "arrears_start_date": lm.arrears_start_date.isoformat() if lm.arrears_start_date else None,
        "last_payment_date": lm.last_payment_date.isoformat() if lm.last_payment_date else None,
        "lvr": _flt(lm.lvr),
        "equity_buffer": _flt(lm.equity_buffer),
        "forced_sale_estimate": _flt(lm.forced_sale_estimate),
        "selling_costs": _flt(lm.selling_costs),
        "holding_costs": _flt(lm.holding_costs),
        "net_recovery_estimate": _flt(lm.net_recovery_estimate),
        "lvr_is_manual": lm.lvr_is_manual,
        "forced_sale_is_manual": lm.forced_sale_is_manual,
        "nccp_subject": lm.nccp_subject,
        "borrower_cooperation": lm.borrower_cooperation,
        "updated_at": lm.updated_at.isoformat(),
    }


def _auction_metrics_out(am: CaseAuctionMetrics) -> dict:
    return {
        "id": str(am.id), "case_id": str(am.case_id),
        "enforcement_type": am.enforcement_type,
        "current_stage": am.current_stage,
        "expected_exit_path": am.expected_exit_path,
        "estimated_timeline": am.estimated_timeline,
        "sale_strategy": am.sale_strategy,
        "refinance_expected": am.refinance_expected,
        "recovery_handler": am.recovery_handler,
        "default_valid": am.default_valid,
        "default_notice_date": am.default_notice_date.isoformat() if am.default_notice_date else None,
        "acceleration_triggered": am.acceleration_triggered,
        "enforcement_commenced": am.enforcement_commenced,
        "court_action": am.court_action,
        "borrower_dispute": am.borrower_dispute,
        "injunction_issue": am.injunction_issue,
        "registered_position": am.registered_position,
        "registered_on_title": am.registered_on_title,
        "other_encumbrances": am.other_encumbrances,
        "competing_lenders": am.competing_lenders,
        "caveats": am.caveats,
        "ato_debt_indicator": am.ato_debt_indicator,
        "priority_ranking": am.priority_ranking,
        "investment_structure": am.investment_structure,
        "minimum_bid": _flt(am.minimum_bid),
        "ownership_rights": am.ownership_rights,
        "security_rights": am.security_rights,
        "distribution_mechanics": am.distribution_mechanics,
        "scenario_base": am.scenario_base,
        "scenario_conservative": am.scenario_conservative,
        "scenario_downside": am.scenario_downside,
        "risk_flags": am.risk_flags or {},
        "updated_at": am.updated_at.isoformat(),
    }


def _note_out(n: CaseInternalNote) -> dict:
    return {
        "id": str(n.id), "case_id": str(n.case_id),
        "author_id": str(n.author_id) if n.author_id else None,
        "author_name": n.author_name,
        "author_role": n.author_role,
        "note_type": n.note_type,
        "content": n.content,
        "is_pinned": n.is_pinned,
        "created_at": n.created_at.isoformat(),
    }


# ─── Securities ───────────────────────────────────────────────────────────────

@router.get("/{case_id}/securities")
async def list_securities(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseSecurity)
        .where(CaseSecurity.case_id == case_id)
        .order_by(CaseSecurity.sort_order)
    )
    return [_security_out(s) for s in result.scalars().all()]


@router.post("/{case_id}/securities", status_code=201)
async def create_security(
    case_id: uuid.UUID,
    body: SecurityIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sec = CaseSecurity(case_id=case_id, **body.model_dump())
    db.add(sec)
    await db.commit()
    await db.refresh(sec)
    return _security_out(sec)


@router.put("/{case_id}/securities/{security_id}")
async def update_security(
    case_id: uuid.UUID,
    security_id: uuid.UUID,
    body: SecurityIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseSecurity).where(
            CaseSecurity.id == security_id,
            CaseSecurity.case_id == case_id,
        )
    )
    sec = result.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Security not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sec, k, v)
    sec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sec)
    return _security_out(sec)


@router.delete("/{case_id}/securities/{security_id}", status_code=204)
async def delete_security(
    case_id: uuid.UUID,
    security_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(CaseSecurity).where(
            CaseSecurity.id == security_id,
            CaseSecurity.case_id == case_id,
        )
    )
    await db.commit()


# ─── Parties ──────────────────────────────────────────────────────────────────

@router.get("/{case_id}/parties")
async def list_parties(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseParty)
        .where(CaseParty.case_id == case_id)
        .order_by(CaseParty.sort_order)
    )
    return [_party_out(p) for p in result.scalars().all()]


@router.post("/{case_id}/parties", status_code=201)
async def create_party(
    case_id: uuid.UUID,
    body: PartyIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    party = CaseParty(case_id=case_id, **body.model_dump())
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return _party_out(party)


@router.put("/{case_id}/parties/{party_id}")
async def update_party(
    case_id: uuid.UUID,
    party_id: uuid.UUID,
    body: PartyIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseParty).where(
            CaseParty.id == party_id,
            CaseParty.case_id == case_id,
        )
    )
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(party, k, v)
    party.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(party)
    return _party_out(party)


@router.delete("/{case_id}/parties/{party_id}", status_code=204)
async def delete_party(
    case_id: uuid.UUID,
    party_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(CaseParty).where(
            CaseParty.id == party_id,
            CaseParty.case_id == case_id,
        )
    )
    await db.commit()


# ─── Loan Metrics ─────────────────────────────────────────────────────────────

@router.get("/{case_id}/loan-metrics")
async def get_loan_metrics(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseLoanMetrics).where(CaseLoanMetrics.case_id == case_id)
    )
    lm = result.scalar_one_or_none()
    return _loan_metrics_out(lm) if lm else {}


@router.put("/{case_id}/loan-metrics")
async def upsert_loan_metrics(
    case_id: uuid.UUID,
    body: LoanMetricsIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseLoanMetrics).where(CaseLoanMetrics.case_id == case_id)
    )
    lm = result.scalar_one_or_none()
    if lm:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(lm, k, v)
        lm.updated_at = datetime.now(timezone.utc)
    else:
        lm = CaseLoanMetrics(case_id=case_id, **body.model_dump())
        db.add(lm)
    await db.commit()
    await db.refresh(lm)
    return _loan_metrics_out(lm)


# ─── Auction Metrics ──────────────────────────────────────────────────────────

@router.get("/{case_id}/auction-metrics")
async def get_auction_metrics(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseAuctionMetrics).where(CaseAuctionMetrics.case_id == case_id)
    )
    am = result.scalar_one_or_none()
    return _auction_metrics_out(am) if am else {}


@router.put("/{case_id}/auction-metrics")
async def upsert_auction_metrics(
    case_id: uuid.UUID,
    body: AuctionMetricsIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role(current_user, "admin", "lawyer", "lender")
    result = await db.execute(
        select(CaseAuctionMetrics).where(CaseAuctionMetrics.case_id == case_id)
    )
    am = result.scalar_one_or_none()
    if am:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(am, k, v)
        am.updated_at = datetime.now(timezone.utc)
    else:
        am = CaseAuctionMetrics(case_id=case_id, **body.model_dump())
        db.add(am)
    await db.commit()
    await db.refresh(am)
    return _auction_metrics_out(am)


# ─── Internal Notes ───────────────────────────────────────────────────────────

@router.get("/{case_id}/internal-notes")
async def list_internal_notes(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role(current_user, "admin", "lawyer", "lender")
    result = await db.execute(
        select(CaseInternalNote)
        .where(CaseInternalNote.case_id == case_id)
        .order_by(CaseInternalNote.is_pinned.desc(), CaseInternalNote.created_at.desc())
    )
    return [_note_out(n) for n in result.scalars().all()]


@router.post("/{case_id}/internal-notes", status_code=201)
async def create_internal_note(
    case_id: uuid.UUID,
    body: InternalNoteIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role(current_user, "admin", "lawyer", "lender")
    roles = current_user.get("roles", [])
    note = CaseInternalNote(
        case_id=case_id,
        author_id=_uid(current_user.get("user_id")),
        author_role=roles[0] if roles else None,
        note_type=body.note_type,
        content=body.content,
        is_pinned=body.is_pinned,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return _note_out(note)


@router.patch("/{case_id}/internal-notes/{note_id}")
async def toggle_note_pin(
    case_id: uuid.UUID,
    note_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle pinned status of a note."""
    _require_role(current_user, "admin", "lawyer", "lender")
    result = await db.execute(
        select(CaseInternalNote).where(
            CaseInternalNote.id == note_id,
            CaseInternalNote.case_id == case_id,
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.is_pinned = not note.is_pinned
    await db.commit()
    await db.refresh(note)
    return _note_out(note)


@router.delete("/{case_id}/internal-notes/{note_id}", status_code=204)
async def delete_internal_note(
    case_id: uuid.UUID,
    note_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role(current_user, "admin", "lawyer", "lender")
    await db.execute(
        delete(CaseInternalNote).where(
            CaseInternalNote.id == note_id,
            CaseInternalNote.case_id == case_id,
        )
    )
    await db.commit()


# ─── Status History ───────────────────────────────────────────────────────────

@router.get("/{case_id}/status-history")
async def get_status_history(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseStatusHistory)
        .where(CaseStatusHistory.case_id == case_id)
        .order_by(CaseStatusHistory.created_at.desc())
    )
    return [
        {
            "id": str(h.id), "case_id": str(h.case_id),
            "from_status": h.from_status, "to_status": h.to_status,
            "changed_by": str(h.changed_by) if h.changed_by else None,
            "changed_by_name": h.changed_by_name,
            "changed_by_role": h.changed_by_role,
            "reason": h.reason,
            "created_at": h.created_at.isoformat(),
        }
        for h in result.scalars().all()
    ]


# ─── Draft Save ───────────────────────────────────────────────────────────────

@router.patch("/{case_id}/draft")
async def save_draft(
    case_id: uuid.UUID,
    body: DraftSaveRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Partial save for in-progress cases — no validation, just persist what we have."""
    from app.modules.cases.models import Case

    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalar_one_or_none()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.now(timezone.utc)
    updates: dict = {"last_saved_at": now}

    if body.workflow_status is not None:
        updates["workflow_status"] = body.workflow_status
    if body.completion_pct is not None:
        updates["completion_pct"] = body.completion_pct
    if body.step_status is not None:
        updates["step_status"] = body.step_status
    if body.title is not None:
        updates["title"] = body.title
    if body.property_address is not None:
        updates["property_address"] = body.property_address
    if body.property_type is not None:
        updates["property_type"] = body.property_type
    if body.estimated_value is not None:
        updates["estimated_value"] = body.estimated_value
    if body.outstanding_debt is not None:
        updates["outstanding_debt"] = body.outstanding_debt
    if body.interest_rate is not None:
        updates["interest_rate"] = body.interest_rate

    # Merge metadata_json rather than replace
    if body.metadata_json is not None:
        existing_meta = dict(case_obj.metadata_json or {})
        existing_meta.update(body.metadata_json)
        updates["metadata_json"] = existing_meta

    await db.execute(sa_update(Case).where(Case.id == case_id).values(**updates))
    await db.commit()

    return {"success": True, "case_id": str(case_id), "saved_at": now.isoformat()}


# ─── Duplicate Case ───────────────────────────────────────────────────────────

@router.post("/{case_id}/duplicate", status_code=201)
async def duplicate_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a DRAFT copy of a case."""
    from app.modules.cases.models import Case
    from app.shared.enums import CaseStatus

    result = await db.execute(select(Case).where(Case.id == case_id))
    orig = result.scalar_one_or_none()
    if not orig:
        raise HTTPException(status_code=404, detail="Case not found")

    borrower_uid = _uid(current_user.get("user_id"))
    if not borrower_uid:
        raise HTTPException(status_code=400, detail="Invalid user identity")

    new_case = Case(
        title=f"Copy of {orig.title}",
        description=orig.description,
        property_address=orig.property_address or "TBC",
        property_type=orig.property_type or "Residential",
        estimated_value=orig.estimated_value or Decimal("0"),
        outstanding_debt=orig.outstanding_debt or Decimal("0"),
        interest_rate=orig.interest_rate,
        tenure=orig.tenure,
        borrower_id=borrower_uid,
        status=CaseStatus.DRAFT,
        workflow_status="draft",
        metadata_json=dict(orig.metadata_json or {}),
        step_status={},
        completion_pct=0,
    )
    db.add(new_case)
    await db.commit()
    await db.refresh(new_case)

    return {
        "success": True,
        "new_case_id": str(new_case.id),
        "title": new_case.title,
        "status": new_case.status.value,
    }


# ─── Archive / Unarchive ──────────────────────────────────────────────────────

@router.post("/{case_id}/archive")
async def archive_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.cases.models import Case
    result = await db.execute(select(Case).where(Case.id == case_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    await db.execute(sa_update(Case).where(Case.id == case_id).values(is_archived=True))
    await db.commit()
    return {"success": True, "case_id": str(case_id), "archived": True}


@router.post("/{case_id}/unarchive")
async def unarchive_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.cases.models import Case
    result = await db.execute(select(Case).where(Case.id == case_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    await db.execute(sa_update(Case).where(Case.id == case_id).values(is_archived=False))
    await db.commit()
    return {"success": True, "case_id": str(case_id), "archived": False}
