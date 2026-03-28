"""
Documents module — Repository layer.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.documents.models import Document
from app.shared.enums import DocumentStatus


class DocumentRepository:
    """Repository for Document CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, document: Document) -> Document:
        """Create a new document record."""
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def get_by_id(self, document_id: uuid.UUID) -> Optional[Document]:
        """Get a document by ID."""
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_by_case(
        self,
        case_id: uuid.UUID,
        status: Optional[DocumentStatus] = None,
    ) -> List[Document]:
        """Get all documents for a case."""
        query = select(Document).where(Document.case_id == case_id)
        if status:
            query = query.where(Document.status == status)
        query = query.order_by(Document.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_user(
        self,
        user_id: uuid.UUID,
    ) -> List[Document]:
        """Get all documents uploaded by a user."""
        query = select(Document).where(Document.uploaded_by == user_id)
        query = query.order_by(Document.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all(
        self, offset: int = 0, limit: int = 200
    ) -> List[Document]:
        """Get all documents (admin use)."""
        result = await self.db.execute(
            select(Document)
            .offset(offset)
            .limit(limit)
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_pending_reviews(
        self, offset: int = 0, limit: int = 20
    ) -> List[Document]:
        """Get documents pending review."""
        result = await self.db.execute(
            select(Document)
            .where(Document.status == DocumentStatus.UPLOADED)
            .offset(offset)
            .limit(limit)
            .order_by(Document.created_at.asc())
        )
        return list(result.scalars().all())

    async def update(self, document: Document) -> Document:
        """Update a document."""
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def delete(self, document: Document) -> None:
        """Delete a document."""
        await self.db.delete(document)
        await self.db.flush()
