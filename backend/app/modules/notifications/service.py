"""
Notifications module — Service layer.
Creates notifications from domain events.
Can be extended to send emails/SMS via SQS queue.
"""
import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.shared.enums import NotificationType, NotificationPriority


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = NotificationRepository(db)

    async def send_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        type: str = "IN_APP",
        priority: str = "MEDIUM",
        trace_id: str = "",
    ) -> Notification:
        """Compatibility wrapper for create_notification."""
        try:
            ntype = NotificationType(type)
        except ValueError:
            ntype = NotificationType.IN_APP
            
        try:
            nprio = NotificationPriority(priority)
        except ValueError:
            nprio = NotificationPriority.MEDIUM

        return await self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=ntype,
            priority=nprio,
            trace_id=trace_id,
        )

    async def create_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.IN_APP,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        trace_id: str = "",
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            priority=priority,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        notification = await self.repository.create(notification)

        # For EMAIL/SMS, queue for async processing
        if notification_type in [NotificationType.EMAIL, NotificationType.SMS]:
            try:
                from app.infrastructure.queue import queue_client
                await queue_client.send_message({
                    "type": "notification",
                    "notification_id": str(notification.id),
                    "channel": notification_type.value,
                    "user_id": str(user_id),
                    "title": title,
                    "message": message,
                })
            except Exception:
                pass  # Queue failure shouldn't block notification creation

        return notification

    async def notify_bid_outbid(
        self, user_id: uuid.UUID, auction_title: str, new_amount: str, trace_id: str
    ) -> Notification:
        """Notify a user they've been outbid."""
        return await self.create_notification(
            user_id=user_id,
            title="You've been outbid!",
            message=f"A higher bid of {new_amount} has been placed on '{auction_title}'.",
            priority=NotificationPriority.HIGH,
            entity_type="auction",
            trace_id=trace_id,
        )

    async def notify_kyc_submitted(self, user_id: uuid.UUID, trace_id: str) -> Notification:
        return await self.create_notification(
            user_id=user_id,
            title="KYC Submitted",
            message="Your identity verification has been submitted. An admin will review your documents shortly.",
            priority=NotificationPriority.MEDIUM,
            entity_type="kyc",
            trace_id=trace_id,
        )

    async def notify_kyc_approved(self, user_id: uuid.UUID, trace_id: str) -> Notification:
        return await self.create_notification(
            user_id=user_id,
            title="KYC Approved",
            message="Your identity has been verified. You now have full access to the platform.",
            priority=NotificationPriority.HIGH,
            entity_type="kyc",
            trace_id=trace_id,
        )

    async def notify_kyc_rejected(self, user_id: uuid.UUID, reason: str, trace_id: str) -> Notification:
        msg = "Your identity verification was rejected."
        if reason:
            msg += f" Reason: {reason}"
        msg += " Please resubmit with valid documents."
        return await self.create_notification(
            user_id=user_id,
            title="KYC Rejected",
            message=msg,
            priority=NotificationPriority.HIGH,
            entity_type="kyc",
            trace_id=trace_id,
        )

    async def notify_role_approved(
        self, user_id: uuid.UUID, role: str, trace_id: str
    ) -> Notification:
        return await self.create_notification(
            user_id=user_id, title="Role Approved",
            message=f"Your {role} role request has been approved.", trace_id=trace_id,
        )

    async def notify_case_approved(
        self, user_id: uuid.UUID, case_title: str, trace_id: str
    ) -> Notification:
        return await self.create_notification(
            user_id=user_id, title="Case Approved",
            message=f"Your case '{case_title}' has been approved.", trace_id=trace_id,
        )

    async def get_user_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False,
        offset: int = 0, limit: int = 20,
    ) -> List[Notification]:
        return await self.repository.get_user_notifications(
            user_id, unread_only, offset, limit
        )

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        return await self.repository.get_unread_count(user_id)

    async def mark_read(self, notification_id: uuid.UUID) -> None:
        await self.repository.mark_read(notification_id)

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.repository.mark_all_read(user_id)
