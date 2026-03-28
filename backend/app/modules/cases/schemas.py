"""
Cases module — Pydantic schemas.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING, Any
from pydantic import BaseModel, Field, model_validator, field_validator

from app.shared.enums import CaseStatus, DealStatus

if TYPE_CHECKING:
    from app.modules.documents.schemas import DocumentResponse


class CaseCreateRequest(BaseModel):
    """Create a new case."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    property_address: str = Field(..., min_length=1)
    property_type: str = Field(..., min_length=1, max_length=50)
    estimated_value: Decimal = Field(..., gt=0)
    outstanding_debt: Decimal = Field(..., gt=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=999.99)
    tenure: Optional[int] = Field(None, gt=0)
    metadata_json: Optional[dict] = None


class CaseUpdateRequest(BaseModel):
    """Update case details (only in DRAFT status)."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = Field(None, max_length=50)
    estimated_value: Optional[Decimal] = Field(None, gt=0)
    outstanding_debt: Optional[Decimal] = Field(None, gt=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=999.99)
    tenure: Optional[int] = Field(None, gt=0)
    # Full metadata merge — replaces/merges into existing metadata_json
    metadata_json: Optional[dict] = None
    # Property metadata fields — allowed in any status
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    valuer_name: Optional[str] = None


class CaseAdminUpdateRequest(BaseModel):
    """Admin update — no status restriction, no ownership check."""
    property_address: Optional[str] = None
    property_type: Optional[str] = Field(None, max_length=50)
    estimated_value: Optional[Decimal] = Field(None, gt=0)
    outstanding_debt: Optional[Decimal] = Field(None, gt=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=999.99)
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    kitchens: Optional[int] = None
    default_rate: Optional[Decimal] = Field(None, ge=0, le=999.99)
    days_in_default: Optional[int] = Field(None, ge=0)
    valuer_name: Optional[str] = None


class CaseReviewRequest(BaseModel):
    """Admin review action for a case."""
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class CaseAssignRequest(BaseModel):
    """Assign a lawyer or lender to a case."""
    lawyer_id: Optional[uuid.UUID] = None
    lender_id: Optional[uuid.UUID] = None

class CaseStatusUpdateRequest(BaseModel):
    """Update case status."""
    status: str



class CaseMetadataUpdateRequest(BaseModel):
    metadata: dict

class CaseResponse(BaseModel):

    """Case response model."""
    id: uuid.UUID
    case_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    property_address: str
    property_type: str
    estimated_value: Decimal
    outstanding_debt: Decimal
    interest_rate: Optional[Decimal] = None
    tenure: Optional[int] = None
    deal_status: Optional[DealStatus] = None
    approved_at: Optional[datetime] = None
    status: CaseStatus
    borrower_id: uuid.UUID
    borrower_name: Optional[str] = None
    assigned_lawyer_id: Optional[uuid.UUID] = None
    lawyer_name: Optional[str] = None
    assigned_lender_id: Optional[uuid.UUID] = None
    lender_name: Optional[str] = None
    risk_level: str = "Medium"
    reviewed_by: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = None
    property_images: List[str] = []
    documents: List[dict] = []
    metadata_json: Optional[dict] = None
    auction_status: Optional[str] = None
    auction_scheduled_end: Optional[datetime] = None
    bid_count: Optional[int] = None
    current_highest_bid: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    version: int

    model_config = {"from_attributes": True}

    @field_validator("documents", mode="before")
    @classmethod
    def validate_documents(cls, v: Any) -> List[dict]:
        """Convert Document ORM objects to dicts safely."""
        if not v:
            return []
        
        # If it's a list (as expected)
        if isinstance(v, list):
            serialized = []
            for item in v:
                # If already a dict, keep it
                if isinstance(item, dict):
                    serialized.append(item)
                    continue
                
                # If it's a SQLAlchemy object
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
                    # Fallback for weird objects
                    continue
            return serialized
        return []

    @model_validator(mode="after")
    def extract_property_images(self) -> "CaseResponse":
        """Pull property_images out of metadata_json if not already set."""
        if not self.property_images and self.metadata_json:
            self.property_images = self.metadata_json.get("property_images", [])
        return self


class CaseListResponse(BaseModel):
    """Paginated case list response."""
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int


CaseListResponse.model_rebuild()
