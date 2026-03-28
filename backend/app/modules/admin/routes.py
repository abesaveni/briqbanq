"""
Admin module — FastAPI routes.
Platform settings management and admin dashboard.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.admin.policies import AdminPolicy
from app.modules.admin.schemas import (
    AdminDashboardResponse,
    PlatformSettingCreateRequest,
    PlatformSettingResponse,
    PlatformSettingUpdateRequest,
)
from app.modules.admin.service import AdminService
from app.modules.identity.schemas import MessageResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_dashboard(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get admin dashboard summary."""
    AdminPolicy.can_view_dashboard(current_user)

    from app.modules.identity.repository import UserRepository
    from app.modules.roles.repository import RoleRepository
    from app.modules.kyc.repository import KYCRepository
    from app.shared.enums import UserStatus, RoleStatus, KYCStatus

    user_repo = UserRepository(db)
    total_users = await user_repo.count()
    active_users = await user_repo.count(status=UserStatus.ACTIVE)
    suspended_users = await user_repo.count(status=UserStatus.SUSPENDED)

    role_repo = RoleRepository(db)
    pending_roles = await role_repo.get_pending_roles(limit=1000)

    kyc_repo = KYCRepository(db)
    pending_kyc = await kyc_repo.get_pending_reviews(limit=1000)

    # Case counts
    from app.modules.cases.service import CaseService
    from app.shared.enums import CaseStatus
    case_service = CaseService(db)
    all_cases, total_cases = await case_service.get_all_cases(offset=0, limit=10000)
    active_cases = sum(1 for c in all_cases if c.status in (CaseStatus.APPROVED, CaseStatus.LISTED, CaseStatus.AUCTION))
    listed_cases = sum(1 for c in all_cases if c.status == CaseStatus.LISTED)

    return AdminDashboardResponse(
        total_users=total_users,
        active_users=active_users,
        suspended_users=suspended_users,
        pending_role_requests=len(pending_roles),
        pending_kyc_reviews=len(pending_kyc),
        total_cases=total_cases,
        active_cases=active_cases,
        listed_cases=listed_cases,
    )


@router.get("/platform-stats")
async def get_platform_stats(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    AdminPolicy.can_view_dashboard(current_user)
    service = AdminService(db)
    return await service.get_platform_stats()

@router.get("/settings", response_model=list[PlatformSettingResponse])
async def get_settings(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all platform settings."""
    AdminPolicy.can_manage_settings(current_user)
    service = AdminService(db)
    return await service.get_all_settings(category)


@router.post("/settings", response_model=PlatformSettingResponse, status_code=201)
async def create_setting(
    request: PlatformSettingCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Create a new platform setting."""
    AdminPolicy.can_manage_settings(current_user)
    service = AdminService(db)
    setting = await service.create_setting(
        key=request.key,
        value=request.value,
        description=request.description,
        category=request.category,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="platform_setting",
        entity_id=str(setting.id),
        action="CREATE_SETTING",
        before_state=None,
        after_state={"key": request.key, "value": request.value},
        trace_id=trace_id,
    )

    return setting


@router.put("/settings/{key}", response_model=PlatformSettingResponse)
async def update_setting(
    key: str,
    request: PlatformSettingUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Update a platform setting."""
    AdminPolicy.can_manage_settings(current_user)
    service = AdminService(db)

    # Get old value for audit
    old_value = await service.get_setting(key)

    setting = await service.update_setting(
        key=key,
        value=request.value,
        description=request.description,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="platform_setting",
        entity_id=str(setting.id),
        action="UPDATE_SETTING",
        before_state={"key": key, "value": old_value},
        after_state={"key": key, "value": request.value},
        trace_id=trace_id,
    )

    return setting


@router.delete("/settings/{key}", response_model=MessageResponse)
async def delete_setting(
    key: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Delete a platform setting."""
    AdminPolicy.can_manage_settings(current_user)
    service = AdminService(db)

    old_value = await service.get_setting(key)
    await service.delete_setting(key, trace_id)

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="platform_setting",
        entity_id=key,
        action="DELETE_SETTING",
        before_state={"key": key, "value": old_value},
        after_state=None,
        trace_id=trace_id,
    )

    return MessageResponse(message=f"Setting '{key}' deleted successfully")


@router.post("/settings/seed", response_model=MessageResponse)
async def seed_defaults(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Seed default platform settings."""
    AdminPolicy.can_manage_settings(current_user)
    service = AdminService(db)
    created = await service.seed_default_settings()
    return MessageResponse(message=f"{len(created)} default settings seeded")
