import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskSummaryStats
from app.modules.tasks.service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all tasks for current authenticated user."""
    service = TaskService(db)
    return await service.get_tasks(uuid.UUID(current_user["user_id"]))

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create new task for current authenticated user."""
    service = TaskService(db)
    return await service.create_task(uuid.UUID(current_user["user_id"]), task_data)

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update specific task for current authenticated user."""
    service = TaskService(db)
    updated = await service.update_task(task_id, uuid.UUID(current_user["user_id"]), task_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete specific task for current authenticated user."""
    service = TaskService(db)
    success = await service.delete_task(task_id, uuid.UUID(current_user["user_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@router.get("/summary", response_model=TaskSummaryStats)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get summarized statistics of tasks for current user."""
    service = TaskService(db)
    return await service.get_summary_stats(uuid.UUID(current_user["user_id"]))


@router.get("/stats", response_model=TaskSummaryStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Alias for /summary — get task statistics for current user."""
    service = TaskService(db)
    return await service.get_summary_stats(uuid.UUID(current_user["user_id"]))
