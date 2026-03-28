"""
Deals module — Service layer.
Business logic for deal lifecycle with state machine enforcement.
"""

import uuid
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidStateTransitionError,
    ResourceConflictError,
    ResourceNotFoundError,
    StaleDataError,
)
from app.modules.deals.models import Deal
from app.modules.deals.repository import DealRepository
from app.shared.enums import DealStatus
from app.shared.mixins import StateMachineMixin


class DealStateMachine(StateMachineMixin):
    """
    Valid deal lifecycle transitions.
    DRAFT → LISTED → UNDER_CONTRACT → SETTLED → CLOSED
    """
    VALID_TRANSITIONS = {
        DealStatus.DRAFT.value: [DealStatus.LISTED.value],
        DealStatus.LISTED.value: [DealStatus.UNDER_CONTRACT.value, DealStatus.CLOSED.value],
        DealStatus.UNDER_CONTRACT.value: [DealStatus.SETTLED.value, DealStatus.LISTED.value],  # Re-list on default
        DealStatus.SETTLED.value: [DealStatus.CLOSED.value],
    }


class DealService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = DealRepository(db)

    async def create_deal(
        self,
        case_id: uuid.UUID,
        title: str,
        description: Optional[str],
        asking_price: Decimal,
        reserve_price: Optional[Decimal],
        seller_id: uuid.UUID,
        created_by: uuid.UUID,
        trace_id: str,
    ) -> Deal:
        """Create a deal from an approved case."""
        existing = await self.repository.get_by_case_id(case_id)
        if existing:
            raise ResourceConflictError(message="A deal already exists for this case")

        deal = Deal(
            case_id=case_id,
            title=title,
            description=description,
            asking_price=asking_price,
            reserve_price=reserve_price,
            status=DealStatus.DRAFT,
            seller_id=seller_id,
            created_by=created_by,
        )
        return await self.repository.create(deal)

    async def list_deal(self, deal_id: uuid.UUID, trace_id: str) -> Deal:
        """List a deal for bidding. DRAFT → LISTED."""
        deal = await self._get_deal_or_404(deal_id)
        DealStateMachine.validate_transition(deal.status.value, DealStatus.LISTED.value)  # type: ignore[attr-defined]
        deal.status = DealStatus.LISTED  # type: ignore[assignment]
        deal.version += 1
        return await self.repository.update(deal)

    async def move_to_contract(
        self, deal_id: uuid.UUID, winning_bidder_id: uuid.UUID, trace_id: str
    ) -> Deal:
        """Move deal under contract after auction. LISTED → UNDER_CONTRACT."""
        deal = await self._get_deal_or_404(deal_id)
        DealStateMachine.validate_transition(deal.status.value, DealStatus.UNDER_CONTRACT.value)  # type: ignore[attr-defined]
        deal.status = DealStatus.UNDER_CONTRACT  # type: ignore[assignment]
        deal.winning_bidder_id = winning_bidder_id  # type: ignore[assignment]
        deal.version += 1
        return await self.repository.update(deal)

    async def relist_deal(self, deal_id: uuid.UUID, trace_id: str) -> Deal:
        """Re-list a deal after bidder default. UNDER_CONTRACT → LISTED."""
        deal = await self._get_deal_or_404(deal_id)
        DealStateMachine.validate_transition(deal.status.value, DealStatus.LISTED.value)  # type: ignore[attr-defined]
        deal.status = DealStatus.LISTED  # type: ignore[assignment]
        deal.winning_bidder_id = None  # type: ignore[assignment]
        deal.version += 1
        return await self.repository.update(deal)

    async def settle_deal(self, deal_id: uuid.UUID, trace_id: str) -> Deal:
        """Settle the deal. UNDER_CONTRACT → SETTLED."""
        deal = await self._get_deal_or_404(deal_id)
        DealStateMachine.validate_transition(deal.status.value, DealStatus.SETTLED.value)  # type: ignore[attr-defined]
        deal.status = DealStatus.SETTLED  # type: ignore[assignment]
        deal.version += 1
        return await self.repository.update(deal)

    async def close_deal(self, deal_id: uuid.UUID, trace_id: str) -> Deal:
        """Close a deal. SETTLED → CLOSED or LISTED → CLOSED."""
        deal = await self._get_deal_or_404(deal_id)
        DealStateMachine.validate_transition(deal.status.value, DealStatus.CLOSED.value)  # type: ignore[attr-defined]
        deal.status = DealStatus.CLOSED  # type: ignore[assignment]
        deal.version += 1
        return await self.repository.update(deal)

    async def get_deal(self, deal_id: uuid.UUID) -> Deal:
        return await self._get_deal_or_404(deal_id)

    async def get_all_deals(
        self, status: Optional[DealStatus] = None, offset: int = 0, limit: int = 20
    ) -> tuple[List[Deal], int]:
        deals = await self.repository.get_all(status, offset, limit)
        total = await self.repository.count(status)
        return deals, total

    async def _get_deal_or_404(self, deal_id: uuid.UUID) -> Deal:
        deal = await self.repository.get_by_id(deal_id)
        if not deal:
            raise ResourceNotFoundError(message="Deal not found")
        return deal
