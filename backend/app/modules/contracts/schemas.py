"""Contracts module — Schemas."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import ContractStatus

class ContractCreateRequest(BaseModel):
    deal_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    contract_type: str = Field(..., min_length=1, max_length=50)
    signer_ids: List[uuid.UUID] = []
    # Manual fields
    property_name: Optional[str] = None
    party_name: Optional[str] = None
    lender_name: Optional[str] = None
    value: Optional[Decimal] = None

class ContractSignRequest(BaseModel):
    signature_hash: str = Field(..., min_length=1)

class ContractResponse(BaseModel):
    id: uuid.UUID
    deal_id: Optional[uuid.UUID] = None
    title: str
    contract_type: str
    status: ContractStatus
    # New fields
    property_name: Optional[str] = None
    party_name: Optional[str] = None
    lender_name: Optional[str] = None
    value: Optional[Decimal] = None
    
    document_s3_key: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    version: int
    model_config = {"from_attributes": True}

class SignatureResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    signer_id: uuid.UUID
    signer_role: str
    signed_at: Optional[datetime] = None
    is_signed: str
    created_at: datetime
    model_config = {"from_attributes": True}
