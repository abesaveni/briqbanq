"""
Documents module — ORM models.
Document uploads and verification for cases.
"""

from sqlalchemy import Column, ForeignKey, String, Text, Integer, Boolean, Enum as SAEnum, Index, JSON as JSONB
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import DocumentStatus


class Document(BaseEntityMixin, Base):
    """
    Document entity linked to a case.
    Lifecycle: UPLOADED → UNDER_REVIEW → APPROVED / REJECTED
    """

    __tablename__ = "documents"

    case_id = Column(
        Uuid(),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    uploaded_by = Column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=False,
    )
    document_name = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)
    s3_key = Column(String(500), nullable=False)
    status = Column(
        SAEnum(DocumentStatus, name="document_status"),
        default=DocumentStatus.UPLOADED,
        nullable=False,
    )
    reviewed_by = Column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=True,
    )
    rejection_reason = Column(Text, nullable=True)

    # Extended metadata fields (fix spec §9)
    category = Column(String(80), nullable=True)
    # security | property | enforcement | borrower | financial | legal
    doc_version = Column(Integer, default=1, nullable=False)
    source = Column(String(150), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    extracted_facts = Column(JSONB, nullable=True)
    # e.g. {"value": 1250000, "date": "2024-01-15", "valuer": "Jones & Co"}
    match_confidence = Column(String(20), nullable=True)
    # matched_automatically | needs_review | verified | not_uploaded

    # Relationships
    case = relationship("Case", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_case_status", "case_id", "status"),
        Index("ix_documents_case_category", "case_id", "category"),
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name={self.document_name}, status={self.status})>"
