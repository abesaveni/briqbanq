"""Wallet module — FastAPI routes."""
import uuid
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.wallet.policies import WalletPolicy
from app.modules.wallet.schemas import (
    WalletResponse, WalletBalanceResponse, LedgerEntryResponse,
    DepositRequest, WalletCreateRequest,
)
from app.modules.wallet.service import WalletService
from app.modules.identity.schemas import MessageResponse
from app.shared.enums import WalletType

router = APIRouter(prefix="/wallets", tags=["Wallets"])


@router.post("/", response_model=WalletResponse, status_code=201)
async def create_wallet(
    request: WalletCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    service = WalletService(db)
    wallet = await service.create_wallet(
        user_id=uuid.UUID(current_user["user_id"]),
        wallet_type=request.wallet_type, label=request.label, trace_id=trace_id,
    )
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role=",".join(current_user.get("roles", [])),
        entity_type="wallet", entity_id=str(wallet.id),
        action="CREATE_WALLET", before_state=None,
        after_state={"wallet_type": request.wallet_type.value, "label": request.label},
        trace_id=trace_id,
    )
    return wallet


@router.get("/my-wallet", response_model=WalletBalanceResponse)
async def get_my_wallet(
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    balance_info = await service.get_balance(wallet.id)
    return WalletBalanceResponse(
        wallet_id=wallet.id,
        balance=balance_info["balance"],
        total_credits=balance_info["total_credits"],
        total_debits=balance_info["total_debits"],
    )


@router.post("/my-wallet/deposit", response_model=LedgerEntryResponse)
async def deposit_funds(
    request: DepositRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    entry = await service.deposit(wallet.id, request.amount, request.description, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role=",".join(current_user.get("roles", [])),
        entity_type="ledger_entry", entity_id=str(entry.id),
        action="DEPOSIT", before_state=None,
        after_state={"amount": str(request.amount), "wallet_id": str(wallet.id)},
        trace_id=trace_id,
    )
    return entry


@router.get("/my-wallet/ledger", response_model=list[LedgerEntryResponse])
async def get_my_ledger(
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    offset = (page - 1) * page_size
    return await service.get_ledger_entries(wallet.id, offset, page_size)

@router.get("/transactions", response_model=list[LedgerEntryResponse])
async def get_wallet_transactions(
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = WalletService(db)
    wallet = await service.get_user_wallet(uuid.UUID(current_user["user_id"]))
    offset = (page - 1) * page_size
    return await service.get_ledger_entries(wallet.id, offset, page_size)


@router.get("/{wallet_id}/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(
    wallet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = WalletService(db)
    wallet = await service.get_wallet(wallet_id)
    if wallet.user_id is not None:  # type: ignore[comparison-overlap]
        WalletPolicy.can_view_wallet(current_user, str(wallet.user_id))
    balance_info = await service.get_balance(wallet_id)
    return WalletBalanceResponse(
        wallet_id=wallet_id,
        balance=balance_info["balance"],
        total_credits=balance_info["total_credits"],
        total_debits=balance_info["total_debits"],
    )
