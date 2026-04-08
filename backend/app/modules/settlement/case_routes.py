"""
Settlement case routes — task checklist management per case.
Tasks are stored in case.metadata_json['settlement_checklist'].
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_db, get_trace_id

router = APIRouter(prefix="/settlement", tags=["Settlement Tasks"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    desc: Optional[str] = None
    assignee: Optional[str] = None
    email: Optional[str] = None
    date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None


class EscalateRequest(BaseModel):
    reason: Optional[str] = None


class ChecklistSaveRequest(BaseModel):
    checklist: dict


# ── Helpers ──────────────────────────────────────────────────────────────────

def _find_task(categories: list, task_id: str):
    for cat in categories:
        for task in cat.get("tasks", []):
            if task.get("id") == task_id:
                return task
    return None


async def _get_case_and_checklist(case_id: uuid.UUID, db):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    meta = dict(case.metadata_json or {})
    checklist = meta.get("settlement_checklist", {})
    return case, meta, checklist


async def _save_checklist(case_id: uuid.UUID, meta: dict, checklist: dict, db, trace_id: str):
    meta["settlement_checklist"] = checklist
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    await service.update_case_metadata(case_id, meta, trace_id)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/case/{case_id}")
async def get_case_settlement(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Return the settlement checklist stored in case metadata."""
    case, meta, checklist = await _get_case_and_checklist(case_id, db)
    return {"success": True, "data": {"breakdown": checklist}}


@router.patch("/case/{case_id}/checklist")
async def save_case_checklist(
    case_id: uuid.UUID,
    request: ChecklistSaveRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Persist the entire settlement checklist for a case."""
    case, meta, _ = await _get_case_and_checklist(case_id, db)
    await _save_checklist(case_id, meta, request.checklist, db, trace_id)
    return {"success": True, "data": {"saved": True}}


@router.patch("/case/{case_id}/tasks/{task_id}")
async def update_settlement_task(
    case_id: uuid.UUID,
    task_id: str,
    request: TaskUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Update fields on a settlement checklist task."""
    case, meta, checklist = await _get_case_and_checklist(case_id, db)
    categories = checklist.get("categories", [])

    task = _find_task(categories, task_id)
    if not task:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError(message=f"Task '{task_id}' not found in checklist")

    updates = request.model_dump(exclude_none=True)
    task.update(updates)

    # Keep status consistent with completed flag
    if "completed" in updates:
        if updates["completed"]:
            task["status"] = "COMPLETED"
        elif task.get("status") == "COMPLETED":
            task["status"] = "IN PROGRESS"

    checklist["categories"] = categories
    await _save_checklist(case_id, meta, checklist, db, trace_id)
    return {"success": True, "data": task}


@router.delete("/case/{case_id}/tasks/{task_id}")
async def archive_settlement_task(
    case_id: uuid.UUID,
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Archive a settlement task (soft delete — marks archived=True)."""
    case, meta, checklist = await _get_case_and_checklist(case_id, db)
    categories = checklist.get("categories", [])

    task = _find_task(categories, task_id)
    if not task:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError(message=f"Task '{task_id}' not found in checklist")

    task["archived"] = True
    task["status"] = "ARCHIVED"

    checklist["categories"] = categories
    await _save_checklist(case_id, meta, checklist, db, trace_id)
    return {"success": True, "data": {"task_id": task_id, "archived": True}}


@router.post("/case/{case_id}/tasks/{task_id}/escalate")
async def escalate_settlement_task(
    case_id: uuid.UUID,
    task_id: str,
    request: EscalateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Escalate a task to compliance — marks priority CRITICAL and logs an escalation note."""
    case, meta, checklist = await _get_case_and_checklist(case_id, db)
    categories = checklist.get("categories", [])

    task = _find_task(categories, task_id)
    if not task:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError(message=f"Task '{task_id}' not found in checklist")

    now = datetime.now(timezone.utc).isoformat()
    actor = current_user.get("email") or current_user.get("user_id", "system")
    reason = request.reason or "Escalated to compliance"

    task["escalated"] = True
    task["escalated_at"] = now
    task["escalated_by"] = actor
    task["priority"] = "CRITICAL"

    notes = task.get("notes", [])
    notes.append(f"[{now[:10]}] ESCALATED by {actor}: {reason}")
    task["notes"] = notes

    checklist["categories"] = categories
    await _save_checklist(case_id, meta, checklist, db, trace_id)
    return {"success": True, "data": task}
