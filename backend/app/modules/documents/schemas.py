"""
Documents module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.shared.enums import DocumentStatus


class DocumentUploadRequest(BaseModel):
    """Document upload metadata."""
    case_id: uuid.UUID
    document_name: str = Field(..., min_length=1, max_length=255)
    document_type: str = Field(..., min_length=1, max_length=50)


class DocumentReviewRequest(BaseModel):
    """Document review action."""
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class DocumentResponse(BaseModel):
    """Document response model."""
    id: uuid.UUID
    case_id: uuid.UUID
    uploaded_by: uuid.UUID
    document_name: str
    document_type: str
    file_name: str
    file_size: int
    content_type: str
    status: DocumentStatus
    reviewed_by: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDownloadResponse(BaseModel):
    """Signed URL response for document download."""
    document_id: uuid.UUID
    document_name: str
    download_url: str
    expires_in: int = 3600
