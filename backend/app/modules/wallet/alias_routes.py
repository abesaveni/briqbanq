"""
Wallet alias routes — /wallet/* (singular prefix).
Frontend dataService calls /api/v1/wallet/* but the canonical router uses /wallets/*.
This thin alias keeps both working.

Frontend calls:
  GET  /api/v1/wallet              → wallet balance
  GET  /api/v1/wallet/transactions → ledger entries
  POST /api/v1/wallet/deposit      → deposit funds
  POST /api/v1/wallet/withdraw     → withdraw funds
"""

import uuid
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.wallet.schemas import WalletBalanceResponse, LedgerEntryResponse
from app.modules.wallet.service import WalletService

router = APIRouter(prefix="/wallet", tags=["Wallets"])


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None


class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None


@router.get("", response_model=WalletBalanceResponse)
async def get_wallet(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get current user's wallet and balance."""
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    balance_info = await service.get_balance(wallet.id)
    return WalletBalanceResponse(
        wallet_id=wallet.id,
        balance=balance_info["balance"],
        total_credits=balance_info["total_credits"],
        total_debits=balance_info["total_debits"],
    )


@router.get("/transactions", response_model=list[LedgerEntryResponse])
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get wallet transactions (ledger entries)."""
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    offset = (page - 1) * page_size
    return await service.get_ledger_entries(wallet.id, offset, page_size)


@router.post("/deposit", response_model=LedgerEntryResponse)
async def deposit(
    request: DepositRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Deposit funds into wallet."""
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    entry = await service.deposit(wallet.id, request.amount, request.description, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="wallet",
        entity_id=str(wallet.id),
        action="DEPOSIT",
        before_state=None,
        after_state={"amount": str(request.amount)},
        trace_id=trace_id,
    )
    return entry


@router.post("/withdraw", response_model=LedgerEntryResponse)
async def withdraw(
    request: WithdrawRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Withdraw funds from wallet."""
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))

    entry = await service.withdraw(wallet.id, request.amount, request.description or "Withdrawal", trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="wallet",
        entity_id=str(wallet.id),
        action="WITHDRAWAL",
        before_state=None,
        after_state={"amount": str(request.amount)},
        trace_id=trace_id,
    )
    return entry
