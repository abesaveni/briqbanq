"""
Documents module — Service layer.
Business logic for document uploads, verification, and access.
"""

import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidStateTransitionError,
    ResourceNotFoundError,
)
from app.infrastructure.storage import storage_client
from app.modules.documents.models import Document
from app.modules.documents.repository import DocumentRepository
from app.shared.enums import DocumentStatus
from app.shared.mixins import StateMachineMixin


class DocumentStateMachine(StateMachineMixin):
    """Valid document status transitions."""
    VALID_TRANSITIONS = {
        DocumentStatus.UPLOADED.value: [DocumentStatus.UNDER_REVIEW.value],
        DocumentStatus.UNDER_REVIEW.value: [
            DocumentStatus.APPROVED.value,
            DocumentStatus.REJECTED.value,
        ],
        DocumentStatus.REJECTED.value: [DocumentStatus.UPLOADED.value],  # Re-upload
    }


class DocumentService:
    """Service layer for document management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = DocumentRepository(db)

    async def upload_document(
        self,
        case_id: uuid.UUID,
        uploaded_by: uuid.UUID,
        document_name: str,
        document_type: str,
        file_name: str,
        file_size: int,
        content_type: str,
        file_content: bytes,
        trace_id: str,
    ) -> Document:
        """
        Upload a document for a case.
        Stores file in S3 and creates DB record.
        """
        # Generate S3 key
        s3_key = f"cases/{case_id}/documents/{uuid.uuid4()}/{file_name}"

        # Upload to S3
        await storage_client.upload_file(
            file_content=file_content,
            key=s3_key,
            content_type=content_type,
        )

        # Create DB record
        document = Document(
            case_id=case_id,
            uploaded_by=uploaded_by,
            document_name=document_name,
            document_type=document_type,
            file_name=file_name,
            file_size=file_size,
            content_type=content_type,
            s3_key=s3_key,
            status=DocumentStatus.UPLOADED,
        )

        return await self.repository.create(document)

    async def start_review(
        self, document_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> Document:
        """Start reviewing a document. UPLOADED → UNDER_REVIEW."""
        document = await self._get_document_or_404(document_id)

        DocumentStateMachine.validate_transition(
            document.status.value, DocumentStatus.UNDER_REVIEW.value  # type: ignore[attr-defined]
        )

        document.status = DocumentStatus.UNDER_REVIEW  # type: ignore[assignment]
        document.reviewed_by = reviewer_id  # type: ignore[assignment]
        document.version += 1
        return await self.repository.update(document)

    async def approve_document(
        self, document_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> Document:
        """Approve a document. UNDER_REVIEW → APPROVED."""
        document = await self._get_document_or_404(document_id)

        DocumentStateMachine.validate_transition(
            document.status.value, DocumentStatus.APPROVED.value  # type: ignore[attr-defined]
        )

        document.status = DocumentStatus.APPROVED  # type: ignore[assignment]
        document.reviewed_by = reviewer_id  # type: ignore[assignment]
        document.version += 1
        return await self.repository.update(document)

    async def reject_document(
        self,
        document_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        reason: Optional[str],
        trace_id: str,
    ) -> Document:
        """Reject a document. UNDER_REVIEW → REJECTED."""
        document = await self._get_document_or_404(document_id)

        DocumentStateMachine.validate_transition(
            document.status.value, DocumentStatus.REJECTED.value  # type: ignore[attr-defined]
        )

        document.status = DocumentStatus.REJECTED  # type: ignore[assignment]
        document.reviewed_by = reviewer_id  # type: ignore[assignment]
        document.rejection_reason = reason  # type: ignore[assignment]
        document.version += 1
        return await self.repository.update(document)

    async def get_download_url(
        self, document_id: uuid.UUID, expiry: int = 3600
    ) -> str:
        """Generate a signed download URL for a document."""
        document = await self._get_document_or_404(document_id)
        return await storage_client.generate_signed_url(document.s3_key, expiry)  # type: ignore[arg-type]

    async def get_case_documents(
        self,
        case_id: uuid.UUID,
        status: Optional[DocumentStatus] = None,
    ) -> List[Document]:
        """Get all documents for a case."""
        docs = await self.repository.get_by_case(case_id, status)
        for doc in docs:
            doc.file_url = await storage_client.generate_signed_url(doc.s3_key)  # type: ignore
        return docs

    async def get_user_documents(
        self,
        user_id: uuid.UUID,
    ) -> List[Document]:
        """Get all documents for a user."""
        docs = await self.repository.get_by_user(user_id)
        for doc in docs:
            doc.file_url = await storage_client.generate_signed_url(doc.s3_key)  # type: ignore
        return docs

    async def get_document(self, document_id: uuid.UUID) -> Document:
        """Get a document by ID."""
        doc = await self._get_document_or_404(document_id)
        doc.file_url = await storage_client.generate_signed_url(doc.s3_key)  # type: ignore
        return doc

    async def get_all_documents(
        self, offset: int = 0, limit: int = 200
    ) -> List[Document]:
        """Get all documents (admin use)."""
        return await self.repository.get_all(offset, limit)

    async def get_pending_reviews(
        self, offset: int = 0, limit: int = 20
    ) -> List[Document]:
        """Get documents pending review."""
        return await self.repository.get_pending_reviews(offset, limit)

    async def delete_document(
        self, document_id: uuid.UUID, user_id: uuid.UUID, trace_id: str
    ) -> None:
        """Delete a document (only if UPLOADED or REJECTED)."""
        document = await self._get_document_or_404(document_id)

        if document.status not in [DocumentStatus.UPLOADED, DocumentStatus.REJECTED]:
            raise InvalidStateTransitionError(
                message="Can only delete documents in UPLOADED or REJECTED status"
            )

        # Delete from S3
        await storage_client.delete_file(document.s3_key)  # type: ignore[arg-type]

        # Delete DB record
        await self.repository.delete(document)

    async def _get_document_or_404(self, document_id: uuid.UUID) -> Document:
        """Get document or raise not found."""
        document = await self.repository.get_by_id(document_id)
        if not document:
            raise ResourceNotFoundError(message="Document not found")
        return document
