"""Settlement module — Events."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class SettlementCreatedEvent:
    settlement_id: str; deal_id: str; trace_id: str
@dataclass
class SettlementCompletedEvent:
    settlement_id: str; deal_id: str; trace_id: str
@dataclass
class SettlementFailedEvent:
    settlement_id: str; deal_id: str; reason: str; trace_id: str
