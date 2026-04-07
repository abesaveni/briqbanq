"""
Deals module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.shared.enums import DealStatus
from app.modules.documents.schemas import DocumentResponse


class DealCreateRequest(BaseModel):
    """Create a deal from a case."""
    case_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    asking_price: Decimal = Field(..., gt=0)
    reserve_price: Optional[Decimal] = Field(None, gt=0)


class DealUpdateRequest(BaseModel):
    """Update deal details (DRAFT only)."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    asking_price: Optional[Decimal] = Field(None, gt=0)
    reserve_price: Optional[Decimal] = Field(None, gt=0)


class DealResponse(BaseModel):
    """Deal response model."""
    id: uuid.UUID
    case_id: uuid.UUID
    title: str
    description: Optional[str] = None
    asking_price: Decimal
    reserve_price: Optional[Decimal] = None
    status: DealStatus
    seller_id: uuid.UUID
    winning_bidder_id: Optional[uuid.UUID] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    version: int

    # Case related fields (joined)
    property_address: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    tenure: Optional[int] = None
    
    # Case + Auction context (derived via ORM relationships)
    case_status: Optional[str] = None
    case_number: Optional[str] = None
    auction_status: Optional[str] = None
    auction_id: Optional[uuid.UUID] = None
    current_highest_bid: Optional[Decimal] = None
    property_images: List[str] = []

    # Unified Assets
    documents: List[dict] = []
    metadata_json_case: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("documents", mode="before")
    @classmethod
    def validate_documents(cls, v: Any) -> List[dict]:
        """Convert Document ORM objects to dicts safely."""
        if not v:
            return []
        
        if isinstance(v, list):
            serialized = []
            for item in v:
                if isinstance(item, dict):
                    serialized.append(item)
                    continue
                try:
                    serialized.append({
                        "id": str(item.id) if hasattr(item, "id") else None,
                        "case_id": str(item.case_id) if hasattr(item, "case_id") else None,
                        "uploaded_by": str(item.uploaded_by) if hasattr(item, "uploaded_by") else None,
                        "document_name": item.document_name if hasattr(item, "document_name") else "",
                        "document_type": item.document_type if hasattr(item, "document_type") else "",
                        "file_name": item.file_name if hasattr(item, "file_name") else "",
                        "file_size": item.file_size if hasattr(item, "file_size") else 0,
                        "content_type": item.content_type if hasattr(item, "content_type") else "",
                        "status": item.status.value if hasattr(item, "status") and hasattr(item.status, "value") else getattr(item, "status", None),
                        "reviewed_by": str(item.reviewed_by) if hasattr(item, "reviewed_by") and item.reviewed_by else None,
                        "rejection_reason": item.rejection_reason if hasattr(item, "rejection_reason") else None,
                        "file_url": item.s3_key if hasattr(item, "s3_key") else None,
                        "created_at": item.created_at.isoformat() if hasattr(item, "created_at") and hasattr(item.created_at, "isoformat") else None,
                        "updated_at": item.updated_at.isoformat() if hasattr(item, "updated_at") and hasattr(item.updated_at, "isoformat") else None,
                    })
                except Exception:
                    continue
            return serialized
        return []


class DealListResponse(BaseModel):
    """Paginated deal list."""
    items: List[DealResponse]
    total: int
    page: int
    page_size: int


DealListResponse.model_rebuild()
