"""Loans module schemas."""
from pydantic import BaseModel, Field
import uuid
from decimal import Decimal

class LoanRepayRequest(BaseModel):
    deal_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)

class LoanRepayResponse(BaseModel):
    installments: int
    interest: float
    remaining_balance: Decimal
