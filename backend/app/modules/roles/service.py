"""
Roles module — Service layer.
Business logic for multi-role assignment and approval workflow.
"""

import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidStateTransitionError,
    ResourceConflictError,
    ResourceNotFoundError,
)
from app.modules.roles.models import UserRole
from app.modules.roles.repository import RoleRepository
from app.shared.enums import RoleStatus, RoleType
from app.shared.mixins import StateMachineMixin


class RoleStateMachine(StateMachineMixin):
    """Valid role status transitions."""
    VALID_TRANSITIONS = {
        RoleStatus.PENDING.value: [RoleStatus.APPROVED.value, RoleStatus.REJECTED.value],
        RoleStatus.APPROVED.value: [RoleStatus.REVOKED.value],
        RoleStatus.REJECTED.value: [RoleStatus.PENDING.value],  # Allow re-request
        RoleStatus.REVOKED.value: [RoleStatus.PENDING.value],   # Allow re-request
    }


class RoleService:
    """Service layer for role management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = RoleRepository(db)

    async def request_role(
        self,
        user_id: uuid.UUID,
        role_type: str,
        trace_id: str,
    ) -> UserRole:
        """Request a new role assignment."""
        role_enum = RoleType(role_type)

        # Check for existing active role
        existing = await self.repository.get_existing_role(user_id, role_enum)
        if existing:
            raise ResourceConflictError(
                message=f"Role {role_type} is already {existing.status.value}"
            )

        # Auto-approve for demo/MVP purposes
        auto_approved = [RoleType.BORROWER, RoleType.LENDER, RoleType.INVESTOR, RoleType.LAWYER, RoleType.ADMIN]
        initial_status = RoleStatus.APPROVED if role_enum in auto_approved else RoleStatus.PENDING

        user_role = UserRole(
            user_id=user_id,
            role_type=role_enum,
            status=initial_status,
        )

        return await self.repository.create(user_role)

    async def approve_role(
        self,
        role_id: uuid.UUID,
        approved_by: uuid.UUID,
        trace_id: str,
    ) -> UserRole:
        """Approve a pending role request."""
        user_role = await self.repository.get_by_id(role_id)
        if not user_role:
            raise ResourceNotFoundError(message="Role request not found")

        # Validate state transition
        RoleStateMachine.validate_transition(
            user_role.status.value, RoleStatus.APPROVED.value
        )

        user_role.status = RoleStatus.APPROVED  # type: ignore[assignment]
        user_role.approved_by = approved_by  # type: ignore[assignment]

        return await self.repository.update(user_role)

    async def reject_role(
        self,
        role_id: uuid.UUID,
        rejected_by: uuid.UUID,
        reason: Optional[str],
        trace_id: str,
    ) -> UserRole:
        """Reject a pending role request."""
        user_role = await self.repository.get_by_id(role_id)
        if not user_role:
            raise ResourceNotFoundError(message="Role request not found")

        RoleStateMachine.validate_transition(
            user_role.status.value, RoleStatus.REJECTED.value
        )

        user_role.status = RoleStatus.REJECTED  # type: ignore[assignment]
        user_role.approved_by = rejected_by  # type: ignore[assignment]
        user_role.rejection_reason = reason  # type: ignore[assignment]

        return await self.repository.update(user_role)

    async def revoke_role(
        self,
        role_id: uuid.UUID,
        revoked_by: uuid.UUID,
        trace_id: str,
    ) -> UserRole:
        """Revoke an approved role."""
        user_role = await self.repository.get_by_id(role_id)
        if not user_role:
            raise ResourceNotFoundError(message="Role not found")

        RoleStateMachine.validate_transition(
            user_role.status.value, RoleStatus.REVOKED.value
        )

        user_role.status = RoleStatus.REVOKED  # type: ignore[assignment]
        user_role.approved_by = revoked_by  # type: ignore[assignment]

        return await self.repository.update(user_role)

    async def get_user_roles(
        self, user_id: uuid.UUID, status: Optional[RoleStatus] = None
    ) -> List[UserRole]:
        """Get all roles for a user."""
        return await self.repository.get_user_roles(user_id, status)

    async def get_pending_roles(
        self, offset: int = 0, limit: int = 20
    ) -> List[UserRole]:
        """Get all pending role requests for admin review."""
        return await self.repository.get_pending_roles(offset, limit)
