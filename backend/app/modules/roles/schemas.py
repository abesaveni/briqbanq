"""
Roles module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.shared.enums import RoleStatus, RoleType


class RoleRequestSchema(BaseModel):
    """Request to assign a role."""
    role_type: RoleType


class RoleApprovalRequest(BaseModel):
    """Admin approval/rejection of a role request."""
    rejection_reason: Optional[str] = Field(None, max_length=500)


class UserRoleResponse(BaseModel):
    """User role response model."""
    id: uuid.UUID
    user_id: uuid.UUID
    role_type: RoleType
    status: RoleStatus
    approved_by: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
