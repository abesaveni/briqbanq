"""
KYC module — ORM models.
KYC verification records for regulated role access.
"""

from sqlalchemy import Column, ForeignKey, String, Text, Enum as SAEnum, Index
from sqlalchemy import Uuid, JSON as JSONB
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import KYCStatus


class KYCRecord(BaseEntityMixin, Base):
    """KYC verification record for a user."""

    __tablename__ = "kyc_records"

    user_id = Column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_type = Column(String(50), nullable=False)  # e.g., PASSPORT, DRIVERS_LICENSE
    document_number = Column(String(100), nullable=False)
    document_s3_key = Column(String(500), nullable=True)
    selfie_s3_key = Column(String(500), nullable=True)
    status = Column(
        SAEnum(KYCStatus, name="kyc_status"),
        default=KYCStatus.SUBMITTED,
        nullable=False,
    )
    reviewed_by = Column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=True,
    )
    rejection_reason = Column(Text, nullable=True)
    metadata_json = Column(JSONB, nullable=True)  # Additional verification data

    # Relationships
    user = relationship("User", back_populates="kyc_records", foreign_keys=[user_id])

    __table_args__ = (
        Index("ix_kyc_records_user_status", "user_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<KYCRecord(user_id={self.user_id}, status={self.status})>"
