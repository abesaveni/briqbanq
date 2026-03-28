"""Notifications module — ORM models."""
from sqlalchemy import Column, ForeignKey, String, Text, Boolean, Enum as SAEnum, Index
from sqlalchemy import Uuid, JSON as JSONB
from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import NotificationType, NotificationPriority


class Notification(BaseEntityMixin, Base):
    """Notification entity — in-app and outbound notifications."""
    __tablename__ = "notifications"

    user_id = Column(Uuid(), ForeignKey("users.id"), nullable=False, index=True)
    notification_type = Column(SAEnum(NotificationType, name="notification_type"), nullable=False)
    priority = Column(SAEnum(NotificationPriority, name="notification_priority"), default=NotificationPriority.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    entity_type = Column(String(50), nullable=True)  # e.g., "case", "bid"
    entity_id = Column(String(36), nullable=True)
    metadata_json = Column(JSONB, nullable=True)

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_user_priority", "user_id", "priority"),
    )

    def __repr__(self) -> str:
        return f"<Notification(user={self.user_id}, title={self.title}, read={self.is_read})>"
