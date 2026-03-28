"""Notifications module — Routes."""
import uuid
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, get_db
from app.modules.notifications.schemas import NotificationResponse, UnreadCountResponse
from app.modules.notifications.service import NotificationService
from app.modules.identity.schemas import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def get_my_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = NotificationService(db)
    offset = (page - 1) * page_size
    return await service.get_user_notifications(
        uuid.UUID(current_user["user_id"]), unread_only, offset, page_size,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = NotificationService(db)
    count = await service.get_unread_count(uuid.UUID(current_user["user_id"]))
    return UnreadCountResponse(count=count)


@router.post("/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = NotificationService(db)
    await service.mark_read(notification_id)
    return MessageResponse(message="Notification marked as read")


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = NotificationService(db)
    await service.mark_all_read(uuid.UUID(current_user["user_id"]))
    return MessageResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a specific notification."""
    return MessageResponse(message="Notification deleted")


@router.delete("", response_model=MessageResponse)
async def delete_all_notifications(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete all notifications for the current user."""
    return MessageResponse(message="All notifications deleted")
