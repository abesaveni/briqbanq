"""
KYC module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field

from app.shared.enums import KYCStatus


class KYCSubmitRequest(BaseModel):
    """KYC submission request."""
    document_type: str = Field(..., min_length=1, max_length=50)
    document_number: str = Field(..., min_length=1, max_length=100)


class KYCReviewRequest(BaseModel):
    """Admin KYC review request."""
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class KYCResponse(BaseModel):
    """KYC record response."""
    id: uuid.UUID
    user_id: uuid.UUID
    document_type: str
    document_number: str
    status: KYCStatus
    reviewed_by: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = None
    metadata_json: Optional[Any] = None
    document_s3_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KYCFormResponse(BaseModel):
    """KYC form submission response (includes personal details)."""
    id: uuid.UUID
    user_id: uuid.UUID
    status: KYCStatus
    document_type: str
    metadata_json: Optional[Any] = None
    document_s3_key: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
