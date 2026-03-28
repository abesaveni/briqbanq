"""Wallet module — Repository layer."""
import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, func, case as sql_case
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.wallet.models import Wallet, LedgerEntry
from app.shared.enums import WalletType, LedgerEntryType


class WalletRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, wallet: Wallet) -> Wallet:
        self.db.add(wallet)
        await self.db.flush()
        await self.db.refresh(wallet)
        return wallet

    async def get_by_id(self, wallet_id: uuid.UUID) -> Optional[Wallet]:
        result = await self.db.execute(select(Wallet).where(Wallet.id == wallet_id))
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: uuid.UUID, wallet_type: Optional[WalletType] = None) -> List[Wallet]:
        query = select(Wallet).where(Wallet.user_id == user_id)
        if wallet_type:
            query = query.where(Wallet.wallet_type == wallet_type)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_user_wallet(self, user_id: uuid.UUID) -> Optional[Wallet]:
        result = await self.db.execute(
            select(Wallet).where(Wallet.user_id == user_id, Wallet.wallet_type == WalletType.USER)
        )
        return result.scalar_one_or_none()

    async def update(self, wallet: Wallet) -> Wallet:
        await self.db.flush()
        await self.db.refresh(wallet)
        return wallet


class LedgerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_entry(self, entry: LedgerEntry) -> LedgerEntry:
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_wallet_balance(self, wallet_id: uuid.UUID) -> dict:
        """Calculate balance from ledger entries (credits - debits)."""
        result = await self.db.execute(
            select(
                func.coalesce(
                    func.sum(sql_case(
                        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount),
                        else_=Decimal("0"),
                    )), Decimal("0")
                ).label("total_credits"),
                func.coalesce(
                    func.sum(sql_case(
                        (LedgerEntry.entry_type == LedgerEntryType.DEBIT, LedgerEntry.amount),
                        else_=Decimal("0"),
                    )), Decimal("0")
                ).label("total_debits"),
            ).where(LedgerEntry.wallet_id == wallet_id)
        )
        row = result.one()
        total_credits = row.total_credits or Decimal("0")
        total_debits = row.total_debits or Decimal("0")
        return {
            "balance": total_credits - total_debits,
            "total_credits": total_credits,
            "total_debits": total_debits,
        }

    async def get_wallet_entries(
        self, wallet_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> List[LedgerEntry]:
        result = await self.db.execute(
            select(LedgerEntry).where(LedgerEntry.wallet_id == wallet_id)
            .offset(offset).limit(limit).order_by(LedgerEntry.created_at.desc())
        )
        return list(result.scalars().all())
