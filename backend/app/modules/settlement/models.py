"""Settlement module — ORM models."""
from sqlalchemy import Column, ForeignKey, String, Numeric, Text, Enum as SAEnum, Index
from sqlalchemy import Uuid, JSON as JSONB
from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import SettlementStatus


class Settlement(BaseEntityMixin, Base):
    """
    Settlement entity — final fund disbursement after contract execution.
    Lifecycle: PENDING → IN_PROGRESS → COMPLETED / FAILED
    """
    __tablename__ = "settlements"

    deal_id = Column(Uuid(), ForeignKey("deals.id"), nullable=False, unique=True, index=True)
    contract_id = Column(Uuid(), ForeignKey("contracts.id"), nullable=False)
    escrow_id = Column(Uuid(), ForeignKey("escrows.id"), nullable=True)
    buyer_id = Column(Uuid(), ForeignKey("users.id"), nullable=False)
    seller_id = Column(Uuid(), ForeignKey("users.id"), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    platform_fee = Column(Numeric(15, 2), nullable=False, default=0)
    net_amount = Column(Numeric(15, 2), nullable=False)
    status = Column(SAEnum(SettlementStatus, name="settlement_status"), default=SettlementStatus.PENDING, nullable=False)
    failure_reason = Column(Text, nullable=True)
    breakdown = Column(JSONB, nullable=True)  # Detailed fee breakdown

    __table_args__ = (Index("ix_settlements_deal_status", "deal_id", "status"),)

    def __repr__(self) -> str:
        return f"<Settlement(id={self.id}, deal={self.deal_id}, status={self.status}, amount={self.total_amount})>"
