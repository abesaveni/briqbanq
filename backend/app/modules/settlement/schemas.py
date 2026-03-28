"""Settlement module — Schemas."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.shared.enums import SettlementStatus

class SettlementCreateRequest(BaseModel):
    deal_id: uuid.UUID
    contract_id: uuid.UUID
    escrow_id: Optional[uuid.UUID] = None
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    total_amount: Decimal = Field(..., gt=0)
    platform_fee: Decimal = Field(default=Decimal("0"), ge=0)

class SettlementUpdateRequest(BaseModel):
    breakdown: dict

class SettlementResponse(BaseModel):

    id: uuid.UUID
    deal_id: uuid.UUID
    contract_id: uuid.UUID
    escrow_id: Optional[uuid.UUID] = None
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    total_amount: Decimal
    platform_fee: Decimal
    net_amount: Decimal
    status: SettlementStatus
    failure_reason: Optional[str] = None
    breakdown: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    version: int
    model_config = {"from_attributes": True}
