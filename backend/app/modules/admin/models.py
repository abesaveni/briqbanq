"""
Admin module — ORM models.
Platform settings (dynamic configuration read at runtime).
"""

from typing import Optional

from sqlalchemy import String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin


class PlatformSetting(BaseEntityMixin, Base):
    """
    Dynamic platform settings.
    Must include: escrow_mode, auto_convert_no_bid, kyc_required_roles, approval_sla_hours.
    Settings are read at runtime — no hardcoded values.
    """

    __tablename__ = "platform_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        Index("ix_platform_settings_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<PlatformSetting(key={self.key}, value={self.value})>"
