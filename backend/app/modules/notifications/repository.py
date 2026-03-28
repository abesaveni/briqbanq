"""Notifications module — Repository."""
import uuid
from typing import List
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def get_user_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False,
        offset: int = 0, limit: int = 20,
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.offset(offset).limit(limit).order_by(Notification.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read == False
            )
        )
        return result.scalar() or 0  # type: ignore[return-value]

    async def mark_read(self, notification_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Notification).where(Notification.id == notification_id)
            .values(is_read=True)
        )
        await self.db.flush()

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Notification).where(
                Notification.user_id == user_id, Notification.is_read == False
            ).values(is_read=True)
        )
        await self.db.flush()
