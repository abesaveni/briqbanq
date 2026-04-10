"""
Auctions module — ORM models.
Auction lifecycle: SCHEDULED → LIVE → PAUSED → LIVE → ENDED
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import ForeignKey, String, Numeric, DateTime, Enum as SAEnum, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import AuctionStatus

if TYPE_CHECKING:
    from app.modules.deals.models import Deal
    from app.modules.bids.models import Bid


class Auction(BaseEntityMixin, Base):
    """
    Auction entity for a deal.
    Lifecycle: SCHEDULED → LIVE → PAUSED → LIVE → ENDED
    """

    __tablename__ = "auctions"

    deal_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("deals.id"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    starting_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    minimum_increment: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=100)
    current_highest_bid: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[AuctionStatus] = mapped_column(
        SAEnum(AuctionStatus, name="auction_status"),
        default=AuctionStatus.SCHEDULED,
        nullable=False,
    )
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    winning_bid_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=False,
    )

    # Relationships
    deal: Mapped["Deal"] = relationship("Deal", back_populates="auctions", lazy="selectin")
    bids: Mapped[List["Bid"]] = relationship("Bid", back_populates="auction", lazy="selectin")

    @property
    def property_address(self) -> Optional[str]:
        return self.deal.property_address if self.deal else None

    @property
    def suburb(self) -> Optional[str]:
        return self.deal.suburb if self.deal else None

    @property
    def state(self) -> Optional[str]:
        return self.deal.state if self.deal else None

    @property
    def postcode(self) -> Optional[str]:
        return self.deal.postcode if self.deal else None

    @property
    def property_type(self) -> Optional[str]:
        return self.deal.property_type if self.deal else None

    @property
    def estimated_value(self) -> Optional[Decimal]:
        return self.deal.estimated_value if self.deal else None

    @property
    def bid_count(self) -> int:
        return len(self.bids) if self.bids else 0

    @property
    def property_images(self) -> list:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            return self.deal.case.metadata_json.get("property_images", [])
        return []

    @property
    def bedrooms(self) -> Optional[int]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("bedrooms")
            try: return int(v) if v not in (None, "") else None
            except (ValueError, TypeError): return None
        return None

    @property
    def bathrooms(self) -> Optional[int]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("bathrooms")
            try: return int(v) if v not in (None, "") else None
            except (ValueError, TypeError): return None
        return None

    @property
    def parking(self) -> Optional[int]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("parking")
            try: return int(v) if v not in (None, "") else None
            except (ValueError, TypeError): return None
        return None

    @property
    def default_rate(self) -> Optional[float]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("default_rate")
            return float(v) if v is not None else None
        return None

    @property
    def days_in_default(self) -> Optional[int]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("days_in_default")
            return int(v) if v is not None else None
        return None

    @property
    def valuer_name(self) -> Optional[str]:
        if self.deal and self.deal.case:
            return (self.deal.case.metadata_json or {}).get("valuer_name") or getattr(self.deal.case, "valuer_name", None)
        return None

    @property
    def land_size(self) -> Optional[str]:
        if self.deal and self.deal.case and self.deal.case.metadata_json:
            v = self.deal.case.metadata_json.get("land_size")
            return str(v) if v is not None else None
        return None

    @property
    def case_id(self) -> Optional[uuid.UUID]:
        return self.deal.case_id if self.deal else None

    @property
    def interest_rate(self) -> Optional[Decimal]:
        return self.deal.interest_rate if self.deal else None

    @property
    def outstanding_debt(self) -> Optional[Decimal]:
        if self.deal and self.deal.case:
            return self.deal.case.outstanding_debt
        return None

    @property
    def case_number(self) -> Optional[str]:
        if self.deal and self.deal.case:
            return self.deal.case.case_number
        return None

    @property
    def tenure(self) -> Optional[int]:
        return self.deal.tenure if self.deal else None

    @property
    def documents(self) -> list:
        """Documents from the linked case."""
        if self.deal and self.deal.case:
            return self.deal.case.documents or []
        return []

    __table_args__ = (
        Index("ix_auctions_status", "status"),
        Index("ix_auctions_deal_status", "deal_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Auction(id={self.id}, status={self.status}, highest_bid={self.current_highest_bid})>"
