import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.tasks.models import Task
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskSummaryStats
from app.shared.enums import TaskStatus, TaskPriority

class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tasks(self, user_id: uuid.UUID) -> List[Task]:
        """Fetch all tasks for a specific user."""
        stmt = (
            select(Task)
            .where(Task.user_id == user_id)
            .order_by(Task.due_date.asc(), Task.priority.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_task(self, user_id: uuid.UUID, task_data: TaskCreate) -> Task:
        """Create a new task."""
        new_task = Task(
            user_id=user_id,
            **task_data.model_dump()
        )
        self.db.add(new_task)
        await self.db.flush()
        await self.db.refresh(new_task)
        return new_task

    async def update_task(self, task_id: uuid.UUID, user_id: uuid.UUID, update_data: TaskUpdate) -> Optional[Task]:
        """Update an existing task."""
        stmt = select(Task).where(and_(Task.id == task_id, Task.user_id == user_id))
        result = await self.db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            return None
        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(task, key, value)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def delete_task(self, task_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a task."""
        stmt = delete(Task).where(and_(Task.id == task_id, Task.user_id == user_id))
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    async def get_summary_stats(self, user_id: uuid.UUID) -> TaskSummaryStats:
        """Calculate summary statistics for a user's tasks."""
        now = datetime.now(timezone.utc)
        
        # Base query for user's tasks
        base_stmt = select(Task).where(Task.user_id == user_id)
        result = await self.db.execute(base_stmt)
        tasks = list(result.scalars().all())
        
        active = sum(1 for t in tasks if t.status != TaskStatus.COMPLETED)
        overdue = sum(1 for t in tasks if t.status != TaskStatus.COMPLETED and t.due_date and t.due_date < now)
        due_today = sum(1 for t in tasks if t.due_date and t.due_date.date() == now.date())
        urgent = sum(1 for t in tasks if t.priority == TaskPriority.URGENT)
        in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
        completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        
        return TaskSummaryStats(
            activeTasks=active,
            overdue=overdue,
            dueToday=due_today,
            urgent=urgent,
            inProgress=in_progress,
            completed=completed
        )
