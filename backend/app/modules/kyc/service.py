"""
KYC module — Service layer.
Business logic for KYC submission and review workflow.
"""

import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidStateTransitionError,
    KYCAlreadySubmittedError,
    ResourceNotFoundError,
)
from app.modules.kyc.models import KYCRecord
from app.modules.kyc.repository import KYCRepository
from app.shared.enums import KYCStatus
from app.shared.mixins import StateMachineMixin


class KYCStateMachine(StateMachineMixin):
    """Valid KYC status transitions."""
    VALID_TRANSITIONS = {
        KYCStatus.NOT_SUBMITTED.value: [KYCStatus.SUBMITTED.value],
        KYCStatus.SUBMITTED.value: [KYCStatus.UNDER_REVIEW.value],
        KYCStatus.UNDER_REVIEW.value: [KYCStatus.APPROVED.value, KYCStatus.REJECTED.value],
        KYCStatus.REJECTED.value: [KYCStatus.SUBMITTED.value],  # Allow resubmission
    }


class KYCService:
    """Service layer for KYC business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = KYCRepository(db)

    async def submit_kyc(
        self,
        user_id: uuid.UUID,
        document_type: str,
        document_number: str,
        document_s3_key: Optional[str] = None,
        selfie_s3_key: Optional[str] = None,
        trace_id: str = "",
    ) -> KYCRecord:
        """Submit KYC verification documents."""
        # Check for existing pending/approved KYC
        latest = await self.repository.get_latest_by_user_id(user_id)
        if latest and latest.status in [KYCStatus.SUBMITTED, KYCStatus.UNDER_REVIEW, KYCStatus.APPROVED]:
            raise KYCAlreadySubmittedError(
                message=f"KYC is already in {latest.status.value} state"
            )

        kyc_record = KYCRecord(
            user_id=user_id,
            document_type=document_type,
            document_number=document_number,
            document_s3_key=document_s3_key,
            selfie_s3_key=selfie_s3_key,
            status=KYCStatus.SUBMITTED,
        )

        return await self.repository.create(kyc_record)

    async def start_review(
        self, kyc_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> KYCRecord:
        """Mark KYC as under review."""
        kyc_record = await self.repository.get_by_id(kyc_id)
        if not kyc_record:
            raise ResourceNotFoundError(message="KYC record not found")

        KYCStateMachine.validate_transition(
            kyc_record.status.value, KYCStatus.UNDER_REVIEW.value
        )

        kyc_record.status = KYCStatus.UNDER_REVIEW  # type: ignore[assignment]
        kyc_record.reviewed_by = reviewer_id  # type: ignore[assignment]

        return await self.repository.update(kyc_record)

    async def approve_kyc(
        self, kyc_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> KYCRecord:
        """Approve KYC verification (single fetch, handles SUBMITTED or UNDER_REVIEW)."""
        kyc_record = await self.repository.get_by_id(kyc_id)
        if not kyc_record:
            raise ResourceNotFoundError(message="KYC record not found")

        # Allow direct SUBMITTED → APPROVED (skip UNDER_REVIEW intermediate step)
        if kyc_record.status.value == KYCStatus.SUBMITTED.value:
            kyc_record.status = KYCStatus.UNDER_REVIEW  # type: ignore[assignment]

        KYCStateMachine.validate_transition(
            kyc_record.status.value, KYCStatus.APPROVED.value
        )

        kyc_record.status = KYCStatus.APPROVED  # type: ignore[assignment]
        kyc_record.reviewed_by = reviewer_id  # type: ignore[assignment]

        return await self.repository.update(kyc_record)

    async def reject_kyc(
        self,
        kyc_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        reason: Optional[str],
        trace_id: str,
    ) -> KYCRecord:
        """Reject KYC verification (single fetch, handles SUBMITTED or UNDER_REVIEW)."""
        kyc_record = await self.repository.get_by_id(kyc_id)
        if not kyc_record:
            raise ResourceNotFoundError(message="KYC record not found")

        # Allow direct SUBMITTED → REJECTED (skip UNDER_REVIEW intermediate step)
        if kyc_record.status.value == KYCStatus.SUBMITTED.value:
            kyc_record.status = KYCStatus.UNDER_REVIEW  # type: ignore[assignment]

        KYCStateMachine.validate_transition(
            kyc_record.status.value, KYCStatus.REJECTED.value
        )

        kyc_record.status = KYCStatus.REJECTED  # type: ignore[assignment]
        kyc_record.reviewed_by = reviewer_id  # type: ignore[assignment]
        kyc_record.rejection_reason = reason  # type: ignore[assignment]

        return await self.repository.update(kyc_record)

    async def get_user_kyc(self, user_id: uuid.UUID) -> List[KYCRecord]:
        """Get all KYC records for a user."""
        return await self.repository.get_by_user_id(user_id)

    async def get_kyc_by_id(self, kyc_id: uuid.UUID) -> Optional[KYCRecord]:
        """Get a single KYC record by ID."""
        return await self.repository.get_by_id(kyc_id)

    async def get_pending_reviews(
        self, offset: int = 0, limit: int = 20
    ) -> List[KYCRecord]:
        """Get KYC records pending review."""
        return await self.repository.get_pending_reviews(offset, limit)

    async def get_all_kyc_records(
        self, offset: int = 0, limit: int = 200
    ) -> List[KYCRecord]:
        """Get all KYC records for admin view."""
        return await self.repository.get_all_records(offset, limit)

    async def is_user_kyc_approved(self, user_id: uuid.UUID) -> bool:
        """Check if user has approved KYC."""
        latest = await self.repository.get_latest_by_user_id(user_id)
        return latest is not None and latest.status.value == KYCStatus.APPROVED.value  # type: ignore[attr-defined]
