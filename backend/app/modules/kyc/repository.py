"""
KYC module — Repository layer.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.kyc.models import KYCRecord
from app.shared.enums import KYCStatus


class KYCRepository:
    """Repository for KYC CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, kyc_record: KYCRecord) -> KYCRecord:
        """Create a new KYC record."""
        self.db.add(kyc_record)
        await self.db.flush()
        await self.db.refresh(kyc_record)
        return kyc_record

    async def get_by_id(self, kyc_id: uuid.UUID) -> Optional[KYCRecord]:
        """Get a KYC record by ID."""
        result = await self.db.execute(
            select(KYCRecord).where(KYCRecord.id == kyc_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> List[KYCRecord]:
        """Get all KYC records for a user."""
        result = await self.db.execute(
            select(KYCRecord)
            .where(KYCRecord.user_id == user_id)
            .order_by(KYCRecord.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_by_user_id(self, user_id: uuid.UUID) -> Optional[KYCRecord]:
        """Get the latest KYC record for a user."""
        result = await self.db.execute(
            select(KYCRecord)
            .where(KYCRecord.user_id == user_id)
            .order_by(KYCRecord.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_pending_reviews(
        self, offset: int = 0, limit: int = 20
    ) -> List[KYCRecord]:
        """Get all KYC records pending review (SUBMITTED status only)."""
        result = await self.db.execute(
            select(KYCRecord)
            .where(KYCRecord.status == KYCStatus.SUBMITTED)
            .offset(offset)
            .limit(limit)
            .order_by(KYCRecord.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_all_records(
        self, offset: int = 0, limit: int = 200
    ) -> List[KYCRecord]:
        """Get all KYC records regardless of status (for admin view)."""
        result = await self.db.execute(
            select(KYCRecord)
            .offset(offset)
            .limit(limit)
            .order_by(KYCRecord.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, kyc_record: KYCRecord) -> KYCRecord:
        """Update a KYC record."""
        await self.db.flush()
        await self.db.refresh(kyc_record)
        return kyc_record
