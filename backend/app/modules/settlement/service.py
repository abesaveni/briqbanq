"""
Settlement module — Service layer.
Orchestrates final fund disbursement:
1. Verify contract is EXECUTED
2. Calculate fee breakdown
3. Release escrow to seller
4. Deduct platform fee
5. Settle deal
"""
import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidStateTransitionError,
    ResourceConflictError,
    ResourceNotFoundError,
)
from app.modules.settlement.models import Settlement
from app.modules.settlement.repository import SettlementRepository
from app.shared.enums import SettlementStatus


class SettlementService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = SettlementRepository(db)

    async def create_settlement(
        self,
        deal_id: uuid.UUID,
        contract_id: uuid.UUID,
        escrow_id: Optional[uuid.UUID],
        buyer_id: uuid.UUID,
        seller_id: uuid.UUID,
        total_amount: Decimal,
        platform_fee: Decimal,
        trace_id: str,
    ) -> Settlement:
        """Create a settlement record for a deal."""
        existing = await self.repository.get_by_deal(deal_id)
        if existing:
            raise ResourceConflictError(message="Settlement already exists for this deal")

        net_amount = total_amount - platform_fee
        breakdown = {
            "total_amount": str(total_amount),
            "platform_fee": str(platform_fee),
            "net_to_seller": str(net_amount),
        }

        settlement = Settlement(
            deal_id=deal_id,
            contract_id=contract_id,
            escrow_id=escrow_id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            total_amount=total_amount,
            platform_fee=platform_fee,
            net_amount=net_amount,
            status=SettlementStatus.PENDING,
            breakdown=breakdown,
        )
        return await self.repository.create(settlement)

    async def process_settlement(
        self, settlement_id: uuid.UUID, trace_id: str
    ) -> Settlement:
        """
        Process settlement: PENDING → IN_PROGRESS → COMPLETED.
        In INTERNAL escrow mode, releases funds via wallet service.
        """
        settlement = await self._get_or_404(settlement_id)
        if settlement.status.value != SettlementStatus.PENDING.value:  # type: ignore[attr-defined]
            raise InvalidStateTransitionError(
                message=f"Cannot process settlement in {settlement.status.value} state"
            )

        settlement.status = SettlementStatus.IN_PROGRESS  # type: ignore[assignment]
        settlement.version += 1
        settlement = await self.repository.update(settlement)

        try:
            # Release escrow if applicable
            if settlement.escrow_id is not None:  # type: ignore[comparison-overlap]
                from app.modules.escrow.service import EscrowService
                escrow_service = EscrowService(self.db)
                await escrow_service.release_escrow(
                    settlement.escrow_id, reason="Settlement completed", trace_id=trace_id  # type: ignore[arg-type]
                )

            # Settle the deal
            from app.modules.deals.service import DealService
            deal_service = DealService(self.db)
            await deal_service.settle_deal(settlement.deal_id, trace_id)  # type: ignore[arg-type]

            settlement.status = SettlementStatus.COMPLETED  # type: ignore[assignment]
            settlement.version += 1
            return await self.repository.update(settlement)

        except Exception as e:
            settlement.status = SettlementStatus.FAILED  # type: ignore[assignment]
            settlement.failure_reason = str(e)  # type: ignore[assignment]
            settlement.version += 1
            await self.repository.update(settlement)
            raise

    async def fail_settlement(
        self, settlement_id: uuid.UUID, reason: str, trace_id: str
    ) -> Settlement:
        """Mark a settlement as failed."""
        settlement = await self._get_or_404(settlement_id)
        settlement.status = SettlementStatus.FAILED  # type: ignore[assignment]
        settlement.failure_reason = reason  # type: ignore[assignment]
        settlement.version += 1
        return await self.repository.update(settlement)

    async def get_settlement(self, settlement_id: uuid.UUID) -> Settlement:
        return await self._get_or_404(settlement_id)

    async def get_deal_settlement(self, deal_id: uuid.UUID) -> Optional[Settlement]:
        return await self.repository.get_by_deal(deal_id)

    async def get_all_settlements(self, offset: int = 0, limit: int = 20):
        return await self.repository.get_all(offset, limit)

    async def update_settlement_breakdown(
        self, settlement_id: uuid.UUID, breakdown: dict, trace_id: str
    ) -> Settlement:
        """Update the breakdown JSON for a settlement."""
        settlement = await self._get_or_404(settlement_id)
        # Merge or replace? Let's replace for now as the frontend sends the whole object
        settlement.breakdown = breakdown
        settlement.version += 1
        return await self.repository.update(settlement)

    async def _get_or_404(self, settlement_id: uuid.UUID) -> Settlement:

        settlement = await self.repository.get_by_id(settlement_id)
        if not settlement:
            raise ResourceNotFoundError(message="Settlement not found")
        return settlement
