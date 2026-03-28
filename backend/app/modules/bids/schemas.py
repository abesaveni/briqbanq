"""Bids module — Pydantic schemas."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import BidStatus


class BidPlaceRequest(BaseModel):
    auction_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)

class BidValidationRequest(BaseModel):
    auction_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)


class BidResponse(BaseModel):
    id: uuid.UUID
    auction_id: uuid.UUID
    bidder_id: uuid.UUID
    bidder_name: Optional[str] = None
    amount: Decimal
    status: BidStatus
    created_at: datetime
    updated_at: datetime
    version: int
    model_config = {"from_attributes": True}


class BidListResponse(BaseModel):
    items: List[BidResponse]
    total: int
