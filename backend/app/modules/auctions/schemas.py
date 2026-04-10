"""
Auctions module — Pydantic schemas.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.shared.enums import AuctionStatus


class BidSummary(BaseModel):
    id: uuid.UUID
    bidder_id: uuid.UUID
    bidder_name: Optional[str] = None
    amount: Decimal
    created_at: datetime
    model_config = {"from_attributes": True}


class DocumentSummary(BaseModel):
    id: uuid.UUID
    document_name: str
    document_type: str
    file_name: Optional[str] = None
    s3_key: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class AuctionCreateRequest(BaseModel):
    deal_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    starting_price: Decimal = Field(..., gt=0)
    minimum_increment: Decimal = Field(default=Decimal("100"), gt=0)
    scheduled_start: datetime
    scheduled_end: datetime


class AuctionResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    title: str
    starting_price: Decimal
    minimum_increment: Decimal
    current_highest_bid: Optional[Decimal] = None
    status: AuctionStatus
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    winning_bid_id: Optional[uuid.UUID] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    version: int = 0
    # Enriched from linked deal → case
    property_address: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    bid_count: Optional[int] = None
    # Property images and specs from case metadata
    property_images: Optional[List[str]] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking: Optional[int] = None
    case_id: Optional[uuid.UUID] = None
    # Loan financials from case
    interest_rate: Optional[Decimal] = None
    outstanding_debt: Optional[Decimal] = None
    case_number: Optional[str] = None
    tenure: Optional[int] = None
    # Additional case metadata fields
    default_rate: Optional[float] = None
    days_in_default: Optional[int] = None
    valuer_name: Optional[str] = None
    land_size: Optional[str] = None
    # Bids list
    bids: Optional[List[BidSummary]] = None
    # Documents from linked case
    documents: Optional[List[DocumentSummary]] = None
    model_config = {"from_attributes": True}


class AuctionWinnerResponse(BaseModel):
    winning_bid_id: uuid.UUID
    winning_investor_id: uuid.UUID
    amount: Decimal
    model_config = {"from_attributes": True}

class AuctionListResponse(BaseModel):
    items: List[AuctionResponse]
    total: int
    page: int
    page_size: int
