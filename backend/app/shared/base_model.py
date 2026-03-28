"""
Base model mixin providing Uuid primary keys, timestamps, and version columns.
Every domain model inherits from this.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid


class UUIDMixin:
    """Uuid primary key mixin."""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class TimestampMixin:
    """Created/updated timestamp mixin."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ImmutableTimestampMixin:
    """Created-only timestamp for immutable records (audit_logs, ledger_entries)."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class VersionMixin:
    """Optimistic locking via version column."""
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )


class BaseEntityMixin(UUIDMixin, TimestampMixin, VersionMixin):
    """Standard mixin for mutable domain entities: Uuid + timestamps + version."""
    pass


class ImmutableEntityMixin(UUIDMixin, ImmutableTimestampMixin):
    """Mixin for immutable records (no updated_at, no version): Uuid + created_at only."""
    pass
