"""
Wallet module — Service layer.
Double-entry ledger: every movement creates a debit AND credit entry.
Balance is always derived from ledger. No direct mutation.
"""
import uuid
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InsufficientFundsError, ResourceNotFoundError
from app.modules.wallet.models import Wallet, LedgerEntry
from app.modules.wallet.repository import WalletRepository, LedgerRepository
from app.shared.enums import WalletType, LedgerEntryType, LedgerTransactionType


class WalletService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.wallet_repo = WalletRepository(db)
        self.ledger_repo = LedgerRepository(db)

    async def create_wallet(
        self, user_id: uuid.UUID, wallet_type: WalletType, label: str, trace_id: str
    ) -> Wallet:
        wallet = Wallet(user_id=user_id, wallet_type=wallet_type, label=label)
        return await self.wallet_repo.create(wallet)

    async def create_platform_wallet(self, label: str, trace_id: str) -> Wallet:
        wallet = Wallet(user_id=None, wallet_type=WalletType.PLATFORM, label=label)
        return await self.wallet_repo.create(wallet)

    async def get_wallet(self, wallet_id: uuid.UUID) -> Wallet:
        wallet = await self.wallet_repo.get_by_id(wallet_id)
        if not wallet:
            raise ResourceNotFoundError(message="Wallet not found")
        return wallet

    async def get_user_wallet(self, user_id: uuid.UUID) -> Wallet:
        wallet = await self.wallet_repo.get_user_wallet(user_id)
        if not wallet:
            raise ResourceNotFoundError(message="User wallet not found")
        return wallet

    async def get_balance(self, wallet_id: uuid.UUID) -> dict:
        """Get wallet balance derived from ledger entries."""
        return await self.ledger_repo.get_wallet_balance(wallet_id)

    async def deposit(
        self, wallet_id: uuid.UUID, amount: Decimal,
        description: Optional[str] = None, trace_id: str = "",
    ) -> LedgerEntry:
        """Credit funds to a wallet."""
        wallet = await self.get_wallet(wallet_id)
        entry = LedgerEntry(
            wallet_id=wallet_id,
            entry_type=LedgerEntryType.CREDIT,
            transaction_type=LedgerTransactionType.DEPOSIT,
            amount=amount,
            description=description or "Deposit",
        )
        return await self.ledger_repo.create_entry(entry)

    async def withdraw(
        self, wallet_id: uuid.UUID, amount: Decimal,
        description: Optional[str] = None, trace_id: str = "",
    ) -> LedgerEntry:
        """Debit funds from a wallet. Checks balance."""
        balance_info = await self.get_balance(wallet_id)
        if balance_info["balance"] < amount:
            raise InsufficientFundsError(
                message=f"Insufficient funds. Available: {balance_info['balance']}, Requested: {amount}"
            )
        entry = LedgerEntry(
            wallet_id=wallet_id,
            entry_type=LedgerEntryType.DEBIT,
            transaction_type=LedgerTransactionType.WITHDRAWAL,
            amount=amount,
            description=description or "Withdrawal",
        )
        return await self.ledger_repo.create_entry(entry)

    async def transfer(
        self,
        from_wallet_id: uuid.UUID,
        to_wallet_id: uuid.UUID,
        amount: Decimal,
        transaction_type: LedgerTransactionType,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        trace_id: str = "",
    ) -> tuple[LedgerEntry, LedgerEntry]:
        """
        Double-entry transfer: debit from source, credit to destination.
        Both entries created atomically in the same transaction.
        """
        # Check source balance
        balance_info = await self.get_balance(from_wallet_id)
        if balance_info["balance"] < amount:
            raise InsufficientFundsError(
                message=f"Insufficient funds. Available: {balance_info['balance']}, Requested: {amount}"
            )

        # Debit source
        debit_entry = LedgerEntry(
            wallet_id=from_wallet_id,
            entry_type=LedgerEntryType.DEBIT,
            transaction_type=transaction_type,
            amount=amount,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description or f"Transfer to {to_wallet_id}",
        )
        debit_entry = await self.ledger_repo.create_entry(debit_entry)

        # Credit destination
        credit_entry = LedgerEntry(
            wallet_id=to_wallet_id,
            entry_type=LedgerEntryType.CREDIT,
            transaction_type=transaction_type,
            amount=amount,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description or f"Transfer from {from_wallet_id}",
        )
        credit_entry = await self.ledger_repo.create_entry(credit_entry)

        return debit_entry, credit_entry

    async def lock_bid_deposit(
        self, bidder_wallet_id: uuid.UUID, escrow_wallet_id: uuid.UUID,
        amount: Decimal, bid_id: str, trace_id: str,
    ) -> tuple[LedgerEntry, LedgerEntry]:
        """Lock bid deposit from bidder wallet to escrow wallet."""
        return await self.transfer(
            from_wallet_id=bidder_wallet_id,
            to_wallet_id=escrow_wallet_id,
            amount=amount,
            transaction_type=LedgerTransactionType.BID_LOCK,
            reference_id=bid_id,
            reference_type="bid",
            description="Bid deposit lock",
            trace_id=trace_id,
        )

    async def release_bid_deposit(
        self, escrow_wallet_id: uuid.UUID, bidder_wallet_id: uuid.UUID,
        amount: Decimal, bid_id: str, trace_id: str,
    ) -> tuple[LedgerEntry, LedgerEntry]:
        """Release bid deposit back to bidder."""
        return await self.transfer(
            from_wallet_id=escrow_wallet_id,
            to_wallet_id=bidder_wallet_id,
            amount=amount,
            transaction_type=LedgerTransactionType.BID_RELEASE,
            reference_id=bid_id,
            reference_type="bid",
            description="Bid deposit release",
            trace_id=trace_id,
        )

    async def get_ledger_entries(
        self, wallet_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> List[LedgerEntry]:
        return await self.ledger_repo.get_wallet_entries(wallet_id, offset, limit)
