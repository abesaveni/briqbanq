"""add rejected to case status enum

Revision ID: 98ef150e9fcc
Revises: 798972dfe6a2
Create Date: 2026-03-17 19:05:43.746023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98ef150e9fcc'
down_revision: Union[str, None] = '798972dfe6a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use execute to run raw SQL for adding enum value
    # Note: ALTER TYPE ... ADD VALUE cannot be rolled back easily in Postgres without dropping the type,
    # and it cannot be executed within a transaction block in some scenarios.
    op.execute("ALTER TYPE case_status ADD VALUE 'REJECTED'")


def downgrade() -> None:
    # Downgrading an enum value is complex in Postgres (requires creating a new type, switching cols, dropping old).
    # For a hotfix, we leave it as is or do nothing as it doesn't break anything to have an extra enum value.
    pass
