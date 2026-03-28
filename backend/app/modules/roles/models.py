"""
Roles module — ORM models.
Multi-role engine with approval workflow.
"""

import uuid

from sqlalchemy import Column, ForeignKey, String, Enum as SAEnum, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import RoleType, RoleStatus


class UserRole(BaseEntityMixin, Base):
    """Maps users to their roles with approval status."""

    __tablename__ = "user_roles"

    user_id = Column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_type = Column(
        SAEnum(RoleType, name="role_type"),
        nullable=False,
    )
    status = Column(
        SAEnum(RoleStatus, name="role_status"),
        default=RoleStatus.PENDING,
        nullable=False,
    )
    approved_by = Column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=True,
    )
    rejection_reason = Column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="user_roles", foreign_keys=[user_id])

    __table_args__ = (
        Index("ix_user_roles_user_status", "user_id", "status"),
        Index("ix_user_roles_role_type", "role_type"),
    )

    def __repr__(self) -> str:
        return f"<UserRole(user_id={self.user_id}, role={self.role_type}, status={self.status})>"
