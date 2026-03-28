import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import TaskStatus, TaskPriority

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    module: Optional[str] = None
    category: Optional[str] = None
    case_number: Optional[str] = None
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    module: Optional[str] = None
    category: Optional[str] = None
    case_number: Optional[str] = None
    tags: Optional[List[str]] = None

class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    module: Optional[str]
    category: Optional[str]
    case_number: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    version: int

    model_config = {"from_attributes": True}

class TaskSummaryStats(BaseModel):
    activeTasks: int
    overdue: int
    dueToday: int
    urgent: int
    inProgress: int
    completed: int
