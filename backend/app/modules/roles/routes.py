"""
Roles module — FastAPI routes.
"""

import uuid

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.roles.policies import RolePolicy
from app.modules.roles.schemas import (
    RoleApprovalRequest,
    RoleRequestSchema,
    UserRoleResponse,
)
from app.modules.roles.service import RoleService

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/request", response_model=UserRoleResponse, status_code=201)
async def request_role(
    request: RoleRequestSchema,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Request a new role assignment."""
    service = RoleService(db)
    user_role = await service.request_role(
        user_id=uuid.UUID(current_user["user_id"]),
        role_type=request.role_type.value,
        trace_id=trace_id,
    )

    # Log audit
    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="user_role",
        entity_id=str(user_role.id),
        action="REQUEST_ROLE",
        before_state=None,
        after_state={"role_type": request.role_type.value, "status": "PENDING"},
        trace_id=trace_id,
    )

    return user_role


@router.get("/my-roles", response_model=list[UserRoleResponse])
async def get_my_roles(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get current user's roles."""
    service = RoleService(db)
    roles = await service.get_user_roles(uuid.UUID(current_user["user_id"]))
    return roles


@router.get("/pending", response_model=list[UserRoleResponse])
async def get_pending_roles(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get pending role requests (admin only)."""
    RolePolicy.can_view_pending_roles(current_user)
    service = RoleService(db)
    offset = (page - 1) * page_size
    return await service.get_pending_roles(offset=offset, limit=page_size)


@router.post("/{role_id}/approve", response_model=UserRoleResponse)
async def approve_role(
    role_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Approve a pending role request (admin only)."""
    RolePolicy.can_approve_role(current_user)
    service = RoleService(db)
    user_role = await service.approve_role(
        role_id=role_id,
        approved_by=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="user_role",
        entity_id=str(role_id),
        action="APPROVE_ROLE",
        before_state={"status": "PENDING"},
        after_state={"status": "APPROVED"},
        trace_id=trace_id,
    )

    return user_role


@router.post("/{role_id}/reject", response_model=UserRoleResponse)
async def reject_role(
    role_id: uuid.UUID,
    request: RoleApprovalRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Reject a pending role request (admin only)."""
    RolePolicy.can_reject_role(current_user)
    service = RoleService(db)
    user_role = await service.reject_role(
        role_id=role_id,
        rejected_by=uuid.UUID(current_user["user_id"]),
        reason=request.rejection_reason,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="user_role",
        entity_id=str(role_id),
        action="REJECT_ROLE",
        before_state={"status": "PENDING"},
        after_state={"status": "REJECTED", "reason": request.rejection_reason},
        trace_id=trace_id,
    )

    return user_role


@router.post("/{role_id}/revoke", response_model=UserRoleResponse)
async def revoke_role(
    role_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Revoke an approved role (admin only)."""
    RolePolicy.can_revoke_role(current_user)
    service = RoleService(db)
    user_role = await service.revoke_role(
        role_id=role_id,
        revoked_by=uuid.UUID(current_user["user_id"]),
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="user_role",
        entity_id=str(role_id),
        action="REVOKE_ROLE",
        before_state={"status": "APPROVED"},
        after_state={"status": "REVOKED"},
        trace_id=trace_id,
    )

    return user_role
