"""Wallet module — Pydantic schemas."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import WalletType, LedgerEntryType, LedgerTransactionType


class WalletCreateRequest(BaseModel):
    wallet_type: WalletType
    label: str = Field(..., min_length=1, max_length=100)

class WalletResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    wallet_type: WalletType
    label: str
    balance: Decimal = Decimal("0")
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class LedgerEntryResponse(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    entry_type: LedgerEntryType
    transaction_type: LedgerTransactionType
    amount: Decimal
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None

class TransferRequest(BaseModel):
    to_wallet_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    transaction_type: LedgerTransactionType
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    description: Optional[str] = None

class WalletBalanceResponse(BaseModel):
    wallet_id: uuid.UUID
    balance: Decimal
    total_credits: Decimal
    total_debits: Decimal
