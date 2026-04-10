"""
Deals module — ORM models.
Deal entity for listed cases.
Lifecycle: DRAFT → LISTED → UNDER_CONTRACT → SETTLED → CLOSED
"""

import uuid
from typing import Optional, List, Any
from decimal import Decimal
from sqlalchemy import ForeignKey, String, Text, Numeric, Enum as SAEnum, Index
from sqlalchemy import Uuid, JSON as JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin
from app.shared.enums import DealStatus


class Deal(BaseEntityMixin, Base):
    """
    Deal entity created from an approved/listed case.
    Lifecycle: DRAFT → LISTED → UNDER_CONTRACT → SETTLED → CLOSED
    """

    __tablename__ = "deals"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asking_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    reserve_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[DealStatus] = mapped_column(
        SAEnum(DealStatus, name="deal_status"),
        default=DealStatus.DRAFT,
        nullable=False,
    )

    # Participants
    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=False,
    )
    winning_bidder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id"),
        nullable=False,
    )

    metadata_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    # Relationships
    case: Mapped["app.modules.cases.models.Case"] = relationship("app.modules.cases.models.Case", lazy="selectin")
    auctions: Mapped[List["Auction"]] = relationship("Auction", back_populates="deal", lazy="selectin")

    __table_args__ = (
        Index("ix_deals_status", "status"),
        Index("ix_deals_seller", "seller_id"),
    )

    @property
    def property_address(self) -> Optional[str]:
        return self.case.property_address if self.case else None

    @property
    def suburb(self) -> Optional[str]:
        # Prefer explicit metadata field set by admin
        if self.case and self.case.metadata_json:
            v = self.case.metadata_json.get("suburb")
            if v:
                return v
        addr = self.property_address
        if not addr:
            return None
        parts = addr.split(",")
        return parts[1].strip() if len(parts) > 1 else None

    @property
    def state(self) -> Optional[str]:
        if self.case and self.case.metadata_json:
            v = self.case.metadata_json.get("state")
            if v:
                return v
        addr = self.property_address
        if not addr:
            return None
        parts = addr.split(",")
        if len(parts) > 2:
            subparts = parts[2].strip().split(" ")
            return subparts[0] if subparts else None
        return None

    @property
    def postcode(self) -> Optional[str]:
        if self.case and self.case.metadata_json:
            v = self.case.metadata_json.get("postcode")
            if v:
                return v
        addr = self.property_address
        if not addr:
            return None
        parts = addr.split(",")
        if len(parts) > 2:
            subparts = parts[2].strip().split(" ")
            return subparts[1] if len(subparts) > 1 else None
        return None

    @property
    def property_type(self) -> Optional[str]:
        return self.case.property_type if self.case else None

    @property
    def estimated_value(self) -> Optional[Decimal]:
        return self.case.estimated_value if self.case else None

    @property
    def interest_rate(self) -> Optional[Decimal]:
        return self.case.interest_rate if self.case else None

    @property
    def tenure(self) -> Optional[int]:
        return self.case.tenure if self.case else None

    @property
    def documents(self) -> List[Any]:
        return self.case.documents if self.case else []

    @property
    def metadata_json_case(self) -> Optional[Any]:
        return self.case.metadata_json if self.case else None

    @property
    def case_status(self) -> Optional[str]:
        return self.case.status.value if self.case and self.case.status else None

    @property
    def case_number(self) -> Optional[str]:
        return self.case.case_number if self.case else None

    @property
    def auction_status(self) -> Optional[str]:
        if self.auctions:
            return self.auctions[0].status.value
        return None

    @property
    def auction_id(self) -> Optional[uuid.UUID]:
        if self.auctions:
            return self.auctions[0].id
        return None

    @property
    def property_images(self) -> list:
        if self.case and self.case.property_images:
            return self.case.property_images
        meta = self.case.metadata_json or {} if self.case else {}
        return meta.get("property_images", [])

    @property
    def current_highest_bid(self) -> Optional[Decimal]:
        if self.auctions:
            return self.auctions[0].current_highest_bid
        return None

    def __repr__(self) -> str:
        return f"<Deal(id={self.id}, title={self.title}, status={self.status})>"
