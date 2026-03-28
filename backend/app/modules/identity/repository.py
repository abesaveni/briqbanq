"""
Identity module — Repository layer.
Raw database access and CRUD operations only.
No business rules or permission logic.
"""

import uuid
from typing import Optional, List

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.models import User
from app.shared.enums import UserStatus, RoleType


class UserRepository:
    """Repository for User CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user: User) -> User:
        """Create a new user."""
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get a user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self, offset: int = 0, limit: int = 20, status: Optional[UserStatus] = None
    ) -> List[User]:
        """Get all users with optional status filter and pagination."""
        query = select(User)
        if status:
            query = query.where(User.status == status)
        query = query.offset(offset).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update(self, user: User) -> User:
        """Update an existing user."""
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_status(self, user_id: uuid.UUID, status: UserStatus) -> None:
        """Update user status."""
        await self.db.execute(
            update(User).where(User.id == user_id).values(status=status)
        )
        await self.db.flush()

    async def count(self, status: Optional[UserStatus] = None) -> int:
        """Count users with optional status filter."""
        from sqlalchemy import func
        query = select(func.count(User.id))
        if status:
            query = query.where(User.status == status)
        result = await self.db.execute(query)
        return result.scalar() or 0  # type: ignore[return-value]

    async def get_users_by_role(self, role_type: RoleType) -> List[User]:
        """Get all users with a specific role."""
        from app.modules.roles.models import UserRole
        from app.shared.enums import RoleStatus
        result = await self.db.execute(
            select(User)
            .join(UserRole, User.id == UserRole.user_id)
            .where(UserRole.role_type == role_type, UserRole.status == RoleStatus.APPROVED)
        )
        return list(result.scalars().all())
