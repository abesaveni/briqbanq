from sqlalchemy import String, Enum as SAEnum, ForeignKey, DateTime, Text, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship, Mapped, mapped_column
import uuid
from typing import Optional, List
from datetime import datetime

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import TaskStatus, TaskPriority

class Task(BaseEntityMixin, Base):
    """Task entity for tracking user actions."""
    __tablename__ = "tasks"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="task_status"),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="task_priority"),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    module: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) 
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    case_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    tags: Mapped[list] = mapped_column(JSON, default=[], server_default='[]', nullable=False)

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"
