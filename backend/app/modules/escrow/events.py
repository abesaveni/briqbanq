"""Escrow module — Events."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class EscrowCreatedEvent:
    escrow_id: str; deal_id: str; trace_id: str
@dataclass
class EscrowHeldEvent:
    escrow_id: str; trace_id: str
@dataclass
class EscrowReleasedEvent:
    escrow_id: str; reason: Optional[str]; trace_id: str
@dataclass
class EscrowRefundedEvent:
    escrow_id: str; reason: Optional[str]; trace_id: str
