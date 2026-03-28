"""
Roles module — Repository layer.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.roles.models import UserRole
from app.shared.enums import RoleStatus, RoleType


class RoleRepository:
    """Repository for UserRole CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_role: UserRole) -> UserRole:
        """Create a new role assignment."""
        self.db.add(user_role)
        await self.db.flush()
        await self.db.refresh(user_role)
        return user_role

    async def get_by_id(self, role_id: uuid.UUID) -> Optional[UserRole]:
        """Get a role assignment by ID."""
        result = await self.db.execute(
            select(UserRole).where(UserRole.id == role_id)
        )
        return result.scalar_one_or_none()

    async def get_user_roles(
        self, user_id: uuid.UUID, status: Optional[RoleStatus] = None
    ) -> List[UserRole]:
        """Get all roles for a user."""
        query = select(UserRole).where(UserRole.user_id == user_id)
        if status:
            query = query.where(UserRole.status == status)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_roles(self, offset: int = 0, limit: int = 20) -> List[UserRole]:
        """Get all pending role requests."""
        query = (
            select(UserRole)
            .where(UserRole.status == RoleStatus.PENDING)
            .offset(offset)
            .limit(limit)
            .order_by(UserRole.created_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_existing_role(
        self, user_id: uuid.UUID, role_type: RoleType
    ) -> Optional[UserRole]:
        """Check if a user already has a specific role assignment."""
        result = await self.db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_type == role_type,
                UserRole.status.in_([RoleStatus.PENDING, RoleStatus.APPROVED]),
            )
        )
        return result.scalar_one_or_none()

    async def update(self, user_role: UserRole) -> UserRole:
        """Update a role assignment."""
        await self.db.flush()
        await self.db.refresh(user_role)
        return user_role
