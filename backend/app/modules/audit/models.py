"""
Audit module — ORM models.
Append-only audit log. No updates or deletes allowed.
"""

from sqlalchemy import Column, String, Text, Index
from sqlalchemy import Uuid, JSON as JSONB

from app.infrastructure.database import Base
from app.shared.base_model import ImmutableEntityMixin


class AuditLog(ImmutableEntityMixin, Base):
    """
    Append-only audit log entry.
    Every state change in the system creates an audit entry.
    Uses ImmutableEntityMixin (no updated_at, no version).
    """

    __tablename__ = "audit_logs"

    actor_id = Column(String(36), nullable=False, index=True)
    actor_role = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    trace_id = Column(String(36), nullable=False, index=True)

    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_actor_action", "actor_id", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog(actor={self.actor_id}, action={self.action}, "
            f"entity={self.entity_type}:{self.entity_id})>"
        )
