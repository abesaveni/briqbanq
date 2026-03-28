"""
Admin module — Repository layer.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import PlatformSetting


class AdminRepository:
    """Repository for platform settings CRUD."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_setting(self, setting: PlatformSetting) -> PlatformSetting:
        """Create a new platform setting."""
        self.db.add(setting)
        await self.db.flush()
        await self.db.refresh(setting)
        return setting

    async def get_setting_by_key(self, key: str) -> Optional[PlatformSetting]:
        """Get a setting by its key."""
        result = await self.db.execute(
            select(PlatformSetting).where(PlatformSetting.key == key)
        )
        return result.scalar_one_or_none()

    async def get_setting_by_id(self, setting_id: uuid.UUID) -> Optional[PlatformSetting]:
        """Get a setting by ID."""
        result = await self.db.execute(
            select(PlatformSetting).where(PlatformSetting.id == setting_id)
        )
        return result.scalar_one_or_none()

    async def get_all_settings(
        self, category: Optional[str] = None
    ) -> List[PlatformSetting]:
        """Get all platform settings with optional category filter."""
        query = select(PlatformSetting)
        if category:
            query = query.where(PlatformSetting.category == category)
        query = query.order_by(PlatformSetting.key)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_setting(self, setting: PlatformSetting) -> PlatformSetting:
        """Update a platform setting."""
        await self.db.flush()
        await self.db.refresh(setting)
        return setting

    async def delete_setting(self, setting: PlatformSetting) -> None:
        """Delete a platform setting."""
        await self.db.delete(setting)
        await self.db.flush()
