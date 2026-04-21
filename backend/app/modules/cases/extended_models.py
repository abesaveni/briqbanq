"""
Extended case models — Securities, Parties, LoanMetrics, AuctionMetrics, InternalNotes.
These extend the base Case with one-to-many child records per the fix spec.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, Numeric, Boolean, Integer, DateTime, Index, JSON as JSONB
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin, ImmutableEntityMixin

if TYPE_CHECKING:
    from app.modules.cases.models import Case


# ─── Security (property / collateral record) ─────────────────────────────────

class CaseSecurity(BaseEntityMixin, Base):
    """
    One-to-many security properties under a case.
    Each security represents a collateral asset or charge.
    """
    __tablename__ = "case_securities"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Address
    property_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suburb: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    postcode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # Classification
    property_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    security_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Ownership
    title_holder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estimated_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    existing_debt: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    priority_position: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Registration
    mortgage_registered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ppsa_registered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Recovery fields
    forced_sale_estimate: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    equity_buffer: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    valuation_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    valuation_provider: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    property_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    days_on_market: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comparable_sales_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    liquidity_rating: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (Index("ix_case_securities_case_id", "case_id"),)


# ─── Party ───────────────────────────────────────────────────────────────────

class CaseParty(BaseEntityMixin, Base):
    """
    A person, company, or trust involved in a case.
    A single case may have many parties of each type.
    """
    __tablename__ = "case_parties"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    party_type: Mapped[str] = mapped_column(String(20), nullable=False)  # individual | company | trust

    # ── Individual fields ──────────────────────────────────────────────────
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dob: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    residential_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    postal_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    employer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    annual_income: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    tfn: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    credit_consent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Company fields ─────────────────────────────────────────────────────
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    acn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    abn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    company_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registered_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trading_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Trust fields ───────────────────────────────────────────────────────
    trust_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    trust_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    trust_abn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    trust_tfn: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    trust_established_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    trustee_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    appointor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Roles (multi-select stored as JSON array) ──────────────────────────
    roles: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    # e.g. ["Borrower", "Guarantor"]

    # ── Nested relationships stored as JSON for flexibility ────────────────
    directors: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    shareholders: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    trustees: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    beneficiaries: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (Index("ix_case_parties_case_id", "case_id"),)


# ─── Loan Metrics ─────────────────────────────────────────────────────────────

class CaseLoanMetrics(BaseEntityMixin, Base):
    """
    Detailed debt and arrears breakdown for a case.
    Replaces the single outstanding_debt field with a full breakdown.
    """
    __tablename__ = "case_loan_metrics"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    # Debt breakdown
    principal_outstanding: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    accrued_interest: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    default_interest: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    fees: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    legal_costs: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    total_arrears: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    total_payout: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    # Arrears behaviour
    missed_payments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_in_arrears: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    arrears_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_payment_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Recovery metrics (auto-calculated or manual)
    lvr: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    equity_buffer: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    forced_sale_estimate: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    selling_costs: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    holding_costs: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    net_recovery_estimate: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    # Override tracking (is value system-calc or manual?)
    lvr_is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    forced_sale_is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # NCCP
    nccp_subject: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Borrower cooperation
    borrower_cooperation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    __table_args__ = (Index("ix_case_loan_metrics_case_id", "case_id"),)


# ─── Auction Metrics ──────────────────────────────────────────────────────────

class CaseAuctionMetrics(BaseEntityMixin, Base):
    """
    Investor-facing recovery intelligence for auction room display.
    Covers legal position, security position, recovery strategy.
    """
    __tablename__ = "case_auction_metrics"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    # Recovery strategy
    enforcement_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_stage: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    expected_exit_path: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    estimated_timeline: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sale_strategy: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    refinance_expected: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    recovery_handler: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Legal position
    default_valid: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    default_notice_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    acceleration_triggered: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    enforcement_commenced: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    court_action: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    borrower_dispute: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    injunction_issue: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    # Security position
    registered_position: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    registered_on_title: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    other_encumbrances: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    competing_lenders: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    caveats: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ato_debt_indicator: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    priority_ranking: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Investment structure
    investment_structure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    minimum_bid: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    ownership_rights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    security_rights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    distribution_mechanics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Scenario analysis stored as JSON
    scenario_base: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    scenario_conservative: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    scenario_downside: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    # Risk flags stored as JSON array
    risk_flags: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    __table_args__ = (Index("ix_case_auction_metrics_case_id", "case_id"),)


# ─── Internal Note ────────────────────────────────────────────────────────────

class CaseInternalNote(BaseEntityMixin, Base):
    """
    Internal working notes for case managers (not visible to borrowers).
    """
    __tablename__ = "case_internal_notes"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(), nullable=True)
    author_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    author_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    note_type: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    # recovery_strategy | borrower_conduct | legal | document_review | risk_review | general
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (Index("ix_case_internal_notes_case_id", "case_id"),)


# ─── Case Status History ──────────────────────────────────────────────────────

class CaseStatusHistory(ImmutableEntityMixin, Base):
    """Immutable record of every status transition for a case."""
    __tablename__ = "case_status_history"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(), nullable=True)
    changed_by_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    changed_by_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("ix_case_status_history_case_id", "case_id"),)
