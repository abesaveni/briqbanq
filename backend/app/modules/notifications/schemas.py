"""Notifications module — Schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.shared.enums import NotificationType, NotificationPriority

class NotificationCreateRequest(BaseModel):
    user_id: uuid.UUID
    notification_type: NotificationType = NotificationType.IN_APP
    priority: NotificationPriority = NotificationPriority.MEDIUM
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    notification_type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    is_read: bool
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class UnreadCountResponse(BaseModel):
    count: int
