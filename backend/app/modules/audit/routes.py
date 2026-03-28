"""
Audit module — FastAPI routes.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.dependencies import get_current_user, get_db
from app.modules.audit.policies import AuditPolicy
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs", response_model=list[AuditLogResponse])
async def get_audit_logs(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get audit logs with filtering (admin only)."""
    AuditPolicy.can_view_audit_logs(current_user)
    service = AuditService(db)
    offset = (page - 1) * page_size
    return await service.get_filtered_logs(
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        action=action,
        offset=offset,
        limit=page_size,
    )


@router.get("/logs/entity/{entity_type}/{entity_id}", response_model=list[AuditLogResponse])
async def get_entity_audit_logs(
    entity_type: str,
    entity_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get audit history for a specific entity (admin only)."""
    AuditPolicy.can_view_audit_logs(current_user)
    service = AuditService(db)
    offset = (page - 1) * page_size
    return await service.get_entity_history(entity_type, entity_id, offset, page_size)


@router.get("/logs/trace/{trace_id}", response_model=list[AuditLogResponse])
async def get_trace_audit_logs(
    trace_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all audit entries for a request trace (admin only)."""
    AuditPolicy.can_view_audit_logs(current_user)
    service = AuditService(db)
    return await service.get_request_trail(trace_id)
