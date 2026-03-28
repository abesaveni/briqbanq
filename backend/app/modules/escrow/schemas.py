"""Escrow module — Pydantic schemas."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.shared.enums import EscrowStatus, EscrowMode

class EscrowCreateRequest(BaseModel):
    deal_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)

class EscrowResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    amount: Decimal
    status: EscrowStatus
    mode: EscrowMode
    escrow_wallet_id: Optional[uuid.UUID] = None
    release_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    version: int
    model_config = {"from_attributes": True}
