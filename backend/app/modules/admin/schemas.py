"""
Admin module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PlatformSettingCreateRequest(BaseModel):
    """Create a new platform setting."""
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)


class PlatformSettingUpdateRequest(BaseModel):
    """Update an existing platform setting."""
    value: str = Field(..., min_length=1)
    description: Optional[str] = None


class PlatformSettingResponse(BaseModel):
    """Platform setting response."""
    id: uuid.UUID
    key: str
    value: str
    description: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminDashboardResponse(BaseModel):
    """Admin dashboard summary."""
    total_users: int
    active_users: int
    suspended_users: int
    pending_role_requests: int
    pending_kyc_reviews: int
    total_cases: int = 0
    active_cases: int = 0
    listed_cases: int = 0
