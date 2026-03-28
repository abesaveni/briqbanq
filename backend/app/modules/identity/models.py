"""
Identity module — User ORM model.
Contains schema only; no business logic.
"""

from sqlalchemy import Column, String, Enum as SAEnum, Index
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import UserStatus


class User(BaseEntityMixin, Base):
    """User entity representing all platform participants."""

    __tablename__ = "users"

    # Email must be unique across the entire system regardless of role
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    status = Column(
        SAEnum(UserStatus, name="user_status"),
        default=UserStatus.ACTIVE,
        nullable=False,
    )

    # Relationships
    user_roles = relationship(
        "UserRole",
        back_populates="user",
        lazy="selectin",
        primaryjoin="User.id == UserRole.user_id",
    )
    kyc_records = relationship(
        "KYCRecord",
        back_populates="user",
        lazy="selectin",
        primaryjoin="User.id == KYCRecord.user_id",
    )

    __table_args__ = (
        Index("ix_users_email_status", "email", "status"),
    )

    @property
    def full_name(self) -> str:
        """Helper to get full name."""
        return f"{self.first_name} {self.last_name}".strip()

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, full_name={self.full_name})>"
