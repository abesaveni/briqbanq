"""
One-shot script: create any missing tables in the SQLite database.
Uses raw SQL with IF NOT EXISTS to be fully idempotent.
Run from the backend/ directory with the project virtualenv active.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy import create_engine, inspect, text

DB_URL = os.getenv("DATABASE_URL_SYNC", "sqlite:///./brickbanq.db")
print(f"Connecting to: {DB_URL}\n")

engine = create_engine(DB_URL, echo=False)

# ─── Raw DDL (fully idempotent via IF NOT EXISTS) ────────────────────────────

TABLES_SQL = [
    # case_securities
    """
    CREATE TABLE IF NOT EXISTS case_securities (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        version     INTEGER NOT NULL DEFAULT 1,
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        property_address TEXT,
        suburb       VARCHAR(100),
        state        VARCHAR(10),
        postcode     VARCHAR(10),
        property_type VARCHAR(100),
        security_type VARCHAR(100),
        title_holder  VARCHAR(255),
        estimated_value NUMERIC(15,2),
        existing_debt   NUMERIC(15,2),
        priority_position VARCHAR(50),
        mortgage_registered BOOLEAN NOT NULL DEFAULT 0,
        ppsa_registered     BOOLEAN NOT NULL DEFAULT 0,
        forced_sale_estimate NUMERIC(15,2),
        equity_buffer        NUMERIC(15,2),
        valuation_date       DATETIME,
        valuation_provider   VARCHAR(255),
        property_condition   VARCHAR(50),
        days_on_market       INTEGER,
        comparable_sales_summary TEXT,
        liquidity_rating     VARCHAR(50),
        notes       TEXT,
        sort_order  INTEGER NOT NULL DEFAULT 0
    )
    """,

    # case_parties
    """
    CREATE TABLE IF NOT EXISTS case_parties (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        version     INTEGER NOT NULL DEFAULT 1,
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        party_type  VARCHAR(20) NOT NULL,
        first_name  VARCHAR(100),
        last_name   VARCHAR(100),
        dob         DATETIME,
        phone       VARCHAR(30),
        email       VARCHAR(255),
        residential_address TEXT,
        postal_address      TEXT,
        occupation          VARCHAR(150),
        employer            VARCHAR(255),
        annual_income       NUMERIC(15,2),
        tfn                 VARCHAR(50),
        credit_consent      BOOLEAN NOT NULL DEFAULT 0,
        company_name        VARCHAR(255),
        acn                 VARCHAR(20),
        abn                 VARCHAR(20),
        company_type        VARCHAR(100),
        registered_address  TEXT,
        trading_address     TEXT,
        industry            VARCHAR(150),
        contact_person      VARCHAR(150),
        contact_phone       VARCHAR(30),
        contact_email       VARCHAR(255),
        trust_name          VARCHAR(255),
        trust_type          VARCHAR(100),
        trust_abn           VARCHAR(20),
        trust_tfn           VARCHAR(50),
        trust_established_date DATETIME,
        trustee_type        VARCHAR(50),
        appointor           VARCHAR(255),
        roles               JSON,
        directors           JSON,
        shareholders        JSON,
        trustees            JSON,
        beneficiaries       JSON,
        sort_order          INTEGER NOT NULL DEFAULT 0
    )
    """,

    # case_loan_metrics
    """
    CREATE TABLE IF NOT EXISTS case_loan_metrics (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        version     INTEGER NOT NULL DEFAULT 1,
        case_id     TEXT NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
        principal_outstanding  NUMERIC(15,2),
        accrued_interest       NUMERIC(15,2),
        default_interest       NUMERIC(15,2),
        fees                   NUMERIC(15,2),
        legal_costs            NUMERIC(15,2),
        total_arrears          NUMERIC(15,2),
        total_payout           NUMERIC(15,2),
        missed_payments        INTEGER,
        days_in_arrears        INTEGER,
        arrears_start_date     DATETIME,
        last_payment_date      DATETIME,
        lvr                    NUMERIC(5,2),
        equity_buffer          NUMERIC(15,2),
        forced_sale_estimate   NUMERIC(15,2),
        selling_costs          NUMERIC(15,2),
        holding_costs          NUMERIC(15,2),
        net_recovery_estimate  NUMERIC(15,2),
        lvr_is_manual          BOOLEAN NOT NULL DEFAULT 0,
        forced_sale_is_manual  BOOLEAN NOT NULL DEFAULT 0,
        nccp_subject           BOOLEAN NOT NULL DEFAULT 0,
        borrower_cooperation   VARCHAR(100)
    )
    """,

    # case_auction_metrics
    """
    CREATE TABLE IF NOT EXISTS case_auction_metrics (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        version     INTEGER NOT NULL DEFAULT 1,
        case_id     TEXT NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
        enforcement_type      VARCHAR(100),
        current_stage         VARCHAR(150),
        expected_exit_path    VARCHAR(150),
        estimated_timeline    VARCHAR(100),
        sale_strategy         VARCHAR(150),
        refinance_expected    BOOLEAN,
        recovery_handler      VARCHAR(255),
        default_valid         BOOLEAN,
        default_notice_date   DATETIME,
        acceleration_triggered BOOLEAN,
        enforcement_commenced  BOOLEAN,
        court_action           BOOLEAN,
        borrower_dispute       BOOLEAN,
        injunction_issue       BOOLEAN,
        registered_position    VARCHAR(50),
        registered_on_title    BOOLEAN,
        other_encumbrances     TEXT,
        competing_lenders      TEXT,
        caveats                TEXT,
        ato_debt_indicator     BOOLEAN,
        priority_ranking       VARCHAR(50),
        investment_structure   VARCHAR(100),
        minimum_bid            NUMERIC(15,2),
        ownership_rights       TEXT,
        security_rights        TEXT,
        distribution_mechanics TEXT,
        scenario_base          JSON,
        scenario_conservative  JSON,
        scenario_downside      JSON,
        risk_flags             JSON
    )
    """,

    # case_internal_notes
    """
    CREATE TABLE IF NOT EXISTS case_internal_notes (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        version     INTEGER NOT NULL DEFAULT 1,
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        author_id   TEXT,
        author_name VARCHAR(150),
        author_role VARCHAR(50),
        note_type   VARCHAR(50) NOT NULL DEFAULT 'general',
        content     TEXT NOT NULL,
        is_pinned   BOOLEAN NOT NULL DEFAULT 0
    )
    """,

    # case_status_history
    """
    CREATE TABLE IF NOT EXISTS case_status_history (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status   VARCHAR(50) NOT NULL,
        changed_by  TEXT,
        changed_by_name VARCHAR(150),
        changed_by_role VARCHAR(50),
        reason      TEXT
    )
    """,
]

INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS ix_case_securities_case_id   ON case_securities(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_case_parties_case_id       ON case_parties(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_case_loan_metrics_case_id  ON case_loan_metrics(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_case_auction_metrics_case_id ON case_auction_metrics(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_case_internal_notes_case_id ON case_internal_notes(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_case_status_history_case_id ON case_status_history(case_id)",
    "CREATE INDEX IF NOT EXISTS ix_documents_case_category ON documents(case_id, category)",
]

# New columns for existing tables
NEW_CASE_COLS = {
    "workflow_status": "VARCHAR(30)",
    "completion_pct":  "INTEGER",
    "last_saved_at":   "DATETIME",
    "is_archived":     "BOOLEAN NOT NULL DEFAULT 0",
    "step_status":     "JSON",
}
NEW_DOC_COLS = {
    "category":         "VARCHAR(80)",
    "doc_version":      "INTEGER NOT NULL DEFAULT 1",
    "source":           "VARCHAR(150)",
    "is_verified":      "BOOLEAN NOT NULL DEFAULT 0",
    "extracted_facts":  "JSON",
    "match_confidence": "VARCHAR(20)",
}

# ─── Execute ─────────────────────────────────────────────────────────────────
with engine.connect() as conn:

    # 1. Create new tables
    for sql in TABLES_SQL:
        table_name = sql.strip().split("IF NOT EXISTS")[1].strip().split()[0]
        conn.execute(text(sql))
        conn.commit()
        print(f"[OK] Table ready: {table_name}")

    # 2. Add missing columns FIRST (indexes may depend on them)
    inspector = inspect(engine)

    existing_case_cols = {c["name"] for c in inspector.get_columns("cases")}
    for col, col_type in NEW_CASE_COLS.items():
        if col not in existing_case_cols:
            conn.execute(text(f'ALTER TABLE "cases" ADD COLUMN "{col}" {col_type}'))
            conn.commit()
            print(f"[OK] Added cases.{col}")
        else:
            print(f"  cases.{col} already exists")

    existing_doc_cols = {c["name"] for c in inspector.get_columns("documents")}
    for col, col_type in NEW_DOC_COLS.items():
        if col not in existing_doc_cols:
            conn.execute(text(f'ALTER TABLE "documents" ADD COLUMN "{col}" {col_type}'))
            conn.commit()
            print(f"[OK] Added documents.{col}")
        else:
            print(f"  documents.{col} already exists")

    # 3. Create indexes (after columns exist)
    for sql in INDEXES_SQL:
        conn.execute(text(sql))
        conn.commit()
    print("[OK] Indexes ready")

print("\nAll done -- database is fully up to date.")
