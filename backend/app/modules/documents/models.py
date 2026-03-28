"""
Documents module — ORM models.
Document uploads and verification for cases.
"""

from sqlalchemy import Column, ForeignKey, String, Text, Integer, Enum as SAEnum, Index
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
    document_type = Column(String(50), nullable=False)  # e.g., TITLE_DEED, VALUATION_REPORT
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
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

    # Relationships
    case = relationship("Case", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_case_status", "case_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name={self.document_name}, status={self.status})>"
