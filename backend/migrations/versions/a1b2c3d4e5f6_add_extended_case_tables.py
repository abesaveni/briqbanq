"""Add extended case tables and new columns

Revision ID: a1b2c3d4e5f6
Revises: 98ef150e9fcc
Create Date: 2026-04-21 00:00:00.000000

Creates:
  - case_securities
  - case_parties
  - case_loan_metrics
  - case_auction_metrics
  - case_internal_notes
  - case_status_history

Alters:
  - cases: adds workflow_status, completion_pct, last_saved_at, is_archived, step_status
  - documents: adds category, doc_version, source, is_verified, extracted_facts, match_confidence
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '98ef150e9fcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── New columns on cases ────────────────────────────────────────────────
    op.add_column('cases', sa.Column('workflow_status', sa.String(30), nullable=True))
    op.add_column('cases', sa.Column('completion_pct', sa.Integer(), nullable=True))
    op.add_column('cases', sa.Column('last_saved_at', sa.DateTime(), nullable=True))
    op.add_column('cases', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('cases', sa.Column('step_status', JSONB(), nullable=True))

    # ─── New columns on documents ────────────────────────────────────────────
    op.add_column('documents', sa.Column('category', sa.String(80), nullable=True))
    op.add_column('documents', sa.Column('doc_version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('documents', sa.Column('source', sa.String(150), nullable=True))
    op.add_column('documents', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('documents', sa.Column('extracted_facts', JSONB(), nullable=True))
    op.add_column('documents', sa.Column('match_confidence', sa.String(20), nullable=True))
    op.create_index('ix_documents_case_category', 'documents', ['case_id', 'category'])

    # ─── case_securities ─────────────────────────────────────────────────────
    op.create_table(
        'case_securities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_address', sa.Text(), nullable=True),
        sa.Column('suburb', sa.String(100), nullable=True),
        sa.Column('state', sa.String(10), nullable=True),
        sa.Column('postcode', sa.String(10), nullable=True),
        sa.Column('property_type', sa.String(100), nullable=True),
        sa.Column('security_type', sa.String(100), nullable=True),
        sa.Column('title_holder', sa.String(255), nullable=True),
        sa.Column('estimated_value', sa.Numeric(15, 2), nullable=True),
        sa.Column('existing_debt', sa.Numeric(15, 2), nullable=True),
        sa.Column('priority_position', sa.String(50), nullable=True),
        sa.Column('mortgage_registered', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ppsa_registered', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('forced_sale_estimate', sa.Numeric(15, 2), nullable=True),
        sa.Column('equity_buffer', sa.Numeric(15, 2), nullable=True),
        sa.Column('valuation_date', sa.DateTime(), nullable=True),
        sa.Column('valuation_provider', sa.String(255), nullable=True),
        sa.Column('property_condition', sa.String(50), nullable=True),
        sa.Column('days_on_market', sa.Integer(), nullable=True),
        sa.Column('comparable_sales_summary', sa.Text(), nullable=True),
        sa.Column('liquidity_rating', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_case_securities_case_id', 'case_securities', ['case_id'])

    # ─── case_parties ─────────────────────────────────────────────────────────
    op.create_table(
        'case_parties',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('party_type', sa.String(20), nullable=False),
        # Individual
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('dob', sa.DateTime(), nullable=True),
        sa.Column('phone', sa.String(30), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('residential_address', sa.Text(), nullable=True),
        sa.Column('postal_address', sa.Text(), nullable=True),
        sa.Column('occupation', sa.String(150), nullable=True),
        sa.Column('employer', sa.String(255), nullable=True),
        sa.Column('annual_income', sa.Numeric(15, 2), nullable=True),
        sa.Column('tfn', sa.String(50), nullable=True),
        sa.Column('credit_consent', sa.Boolean(), nullable=False, server_default='false'),
        # Company
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('acn', sa.String(20), nullable=True),
        sa.Column('abn', sa.String(20), nullable=True),
        sa.Column('company_type', sa.String(100), nullable=True),
        sa.Column('registered_address', sa.Text(), nullable=True),
        sa.Column('trading_address', sa.Text(), nullable=True),
        sa.Column('industry', sa.String(150), nullable=True),
        sa.Column('contact_person', sa.String(150), nullable=True),
        sa.Column('contact_phone', sa.String(30), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        # Trust
        sa.Column('trust_name', sa.String(255), nullable=True),
        sa.Column('trust_type', sa.String(100), nullable=True),
        sa.Column('trust_abn', sa.String(20), nullable=True),
        sa.Column('trust_tfn', sa.String(50), nullable=True),
        sa.Column('trust_established_date', sa.DateTime(), nullable=True),
        sa.Column('trustee_type', sa.String(50), nullable=True),
        sa.Column('appointor', sa.String(255), nullable=True),
        # JSON
        sa.Column('roles', JSONB(), nullable=True),
        sa.Column('directors', JSONB(), nullable=True),
        sa.Column('shareholders', JSONB(), nullable=True),
        sa.Column('trustees', JSONB(), nullable=True),
        sa.Column('beneficiaries', JSONB(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_case_parties_case_id', 'case_parties', ['case_id'])

    # ─── case_loan_metrics ────────────────────────────────────────────────────
    op.create_table(
        'case_loan_metrics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('principal_outstanding', sa.Numeric(15, 2), nullable=True),
        sa.Column('accrued_interest', sa.Numeric(15, 2), nullable=True),
        sa.Column('default_interest', sa.Numeric(15, 2), nullable=True),
        sa.Column('fees', sa.Numeric(15, 2), nullable=True),
        sa.Column('legal_costs', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_arrears', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_payout', sa.Numeric(15, 2), nullable=True),
        sa.Column('missed_payments', sa.Integer(), nullable=True),
        sa.Column('days_in_arrears', sa.Integer(), nullable=True),
        sa.Column('arrears_start_date', sa.DateTime(), nullable=True),
        sa.Column('last_payment_date', sa.DateTime(), nullable=True),
        sa.Column('lvr', sa.Numeric(5, 2), nullable=True),
        sa.Column('equity_buffer', sa.Numeric(15, 2), nullable=True),
        sa.Column('forced_sale_estimate', sa.Numeric(15, 2), nullable=True),
        sa.Column('selling_costs', sa.Numeric(15, 2), nullable=True),
        sa.Column('holding_costs', sa.Numeric(15, 2), nullable=True),
        sa.Column('net_recovery_estimate', sa.Numeric(15, 2), nullable=True),
        sa.Column('lvr_is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('forced_sale_is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('nccp_subject', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('borrower_cooperation', sa.String(100), nullable=True),
    )
    op.create_index('ix_case_loan_metrics_case_id', 'case_loan_metrics', ['case_id'])

    # ─── case_auction_metrics ─────────────────────────────────────────────────
    op.create_table(
        'case_auction_metrics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('enforcement_type', sa.String(100), nullable=True),
        sa.Column('current_stage', sa.String(150), nullable=True),
        sa.Column('expected_exit_path', sa.String(150), nullable=True),
        sa.Column('estimated_timeline', sa.String(100), nullable=True),
        sa.Column('sale_strategy', sa.String(150), nullable=True),
        sa.Column('refinance_expected', sa.Boolean(), nullable=True),
        sa.Column('recovery_handler', sa.String(255), nullable=True),
        sa.Column('default_valid', sa.Boolean(), nullable=True),
        sa.Column('default_notice_date', sa.DateTime(), nullable=True),
        sa.Column('acceleration_triggered', sa.Boolean(), nullable=True),
        sa.Column('enforcement_commenced', sa.Boolean(), nullable=True),
        sa.Column('court_action', sa.Boolean(), nullable=True),
        sa.Column('borrower_dispute', sa.Boolean(), nullable=True),
        sa.Column('injunction_issue', sa.Boolean(), nullable=True),
        sa.Column('registered_position', sa.String(50), nullable=True),
        sa.Column('registered_on_title', sa.Boolean(), nullable=True),
        sa.Column('other_encumbrances', sa.Text(), nullable=True),
        sa.Column('competing_lenders', sa.Text(), nullable=True),
        sa.Column('caveats', sa.Text(), nullable=True),
        sa.Column('ato_debt_indicator', sa.Boolean(), nullable=True),
        sa.Column('priority_ranking', sa.String(50), nullable=True),
        sa.Column('investment_structure', sa.String(100), nullable=True),
        sa.Column('minimum_bid', sa.Numeric(15, 2), nullable=True),
        sa.Column('ownership_rights', sa.Text(), nullable=True),
        sa.Column('security_rights', sa.Text(), nullable=True),
        sa.Column('distribution_mechanics', sa.Text(), nullable=True),
        sa.Column('scenario_base', JSONB(), nullable=True),
        sa.Column('scenario_conservative', JSONB(), nullable=True),
        sa.Column('scenario_downside', JSONB(), nullable=True),
        sa.Column('risk_flags', JSONB(), nullable=True),
    )
    op.create_index('ix_case_auction_metrics_case_id', 'case_auction_metrics', ['case_id'])

    # ─── case_internal_notes ──────────────────────────────────────────────────
    op.create_table(
        'case_internal_notes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', UUID(as_uuid=True), nullable=True),
        sa.Column('author_name', sa.String(150), nullable=True),
        sa.Column('author_role', sa.String(50), nullable=True),
        sa.Column('note_type', sa.String(50), nullable=False, server_default='general'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_index('ix_case_internal_notes_case_id', 'case_internal_notes', ['case_id'])

    # ─── case_status_history ─────────────────────────────────────────────────
    op.create_table(
        'case_status_history',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('case_id', UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('from_status', sa.String(50), nullable=True),
        sa.Column('to_status', sa.String(50), nullable=False),
        sa.Column('changed_by', UUID(as_uuid=True), nullable=True),
        sa.Column('changed_by_name', sa.String(150), nullable=True),
        sa.Column('changed_by_role', sa.String(50), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
    )
    op.create_index('ix_case_status_history_case_id', 'case_status_history', ['case_id'])


def downgrade() -> None:
    # Drop new tables
    op.drop_index('ix_case_status_history_case_id', 'case_status_history')
    op.drop_table('case_status_history')

    op.drop_index('ix_case_internal_notes_case_id', 'case_internal_notes')
    op.drop_table('case_internal_notes')

    op.drop_index('ix_case_auction_metrics_case_id', 'case_auction_metrics')
    op.drop_table('case_auction_metrics')

    op.drop_index('ix_case_loan_metrics_case_id', 'case_loan_metrics')
    op.drop_table('case_loan_metrics')

    op.drop_index('ix_case_parties_case_id', 'case_parties')
    op.drop_table('case_parties')

    op.drop_index('ix_case_securities_case_id', 'case_securities')
    op.drop_table('case_securities')

    # Drop new document columns
    op.drop_index('ix_documents_case_category', 'documents')
    op.drop_column('documents', 'match_confidence')
    op.drop_column('documents', 'extracted_facts')
    op.drop_column('documents', 'is_verified')
    op.drop_column('documents', 'source')
    op.drop_column('documents', 'doc_version')
    op.drop_column('documents', 'category')

    # Drop new case columns
    op.drop_column('cases', 'step_status')
    op.drop_column('cases', 'is_archived')
    op.drop_column('cases', 'last_saved_at')
    op.drop_column('cases', 'completion_pct')
    op.drop_column('cases', 'workflow_status')
