"""
Wallet module — ORM models.
Double-entry ledger system. Balance derived from ledger entries only.
No direct balance mutation allowed.
"""
from sqlalchemy import Column, ForeignKey, String, Numeric, Text, Enum as SAEnum, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin, ImmutableEntityMixin
from app.shared.enums import WalletType, LedgerEntryType, LedgerTransactionType


class Wallet(BaseEntityMixin, Base):
    """Wallet entity. Balance is DERIVED from ledger — never mutated directly."""

    __tablename__ = "wallets"

    user_id = Column(Uuid(), ForeignKey("users.id"), nullable=True, index=True)
    wallet_type = Column(SAEnum(WalletType, name="wallet_type"), nullable=False)
    label = Column(String(100), nullable=False)

    # Relationships
    ledger_entries = relationship("LedgerEntry", back_populates="wallet", lazy="selectin")

    __table_args__ = (
        Index("ix_wallets_user_type", "user_id", "wallet_type"),
    )

    def __repr__(self) -> str:
        return f"<Wallet(id={self.id}, type={self.wallet_type}, label={self.label})>"


class LedgerEntry(ImmutableEntityMixin, Base):
    """
    Immutable double-entry ledger entry.
    No updated_at, no version. Append-only.
    Every movement must be logged here.
    """

    __tablename__ = "ledger_entries"

    wallet_id = Column(Uuid(), ForeignKey("wallets.id"), nullable=False, index=True)
    entry_type = Column(SAEnum(LedgerEntryType, name="ledger_entry_type"), nullable=False)
    transaction_type = Column(SAEnum(LedgerTransactionType, name="ledger_transaction_type"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    reference_id = Column(String(36), nullable=True)  # e.g., bid_id, escrow_id
    reference_type = Column(String(50), nullable=True)  # e.g., "bid", "escrow"
    description = Column(Text, nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="ledger_entries")

    __table_args__ = (
        Index("ix_ledger_wallet_type", "wallet_id", "entry_type"),
        Index("ix_ledger_reference", "reference_id", "reference_type"),
    )

    def __repr__(self) -> str:
        return f"<LedgerEntry(wallet={self.wallet_id}, type={self.entry_type}, amount={self.amount})>"
