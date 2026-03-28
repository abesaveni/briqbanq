"""
Audit module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    """Audit log response model."""
    id: uuid.UUID
    actor_id: str
    actor_role: str
    entity_type: str
    entity_id: str
    action: str
    before_state: Optional[dict] = None
    after_state: Optional[dict] = None
    trace_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogFilterRequest(BaseModel):
    """Audit log filter parameters."""
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    actor_id: Optional[str] = None
    action: Optional[str] = None
    page: int = 1
    page_size: int = 20
