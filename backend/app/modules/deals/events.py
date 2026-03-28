"""
Deals module — Domain events.
"""
from dataclasses import dataclass
from typing import Optional

@dataclass
class DealCreatedEvent:
    deal_id: str
    case_id: str
    trace_id: str

@dataclass
class DealListedEvent:
    deal_id: str
    trace_id: str

@dataclass
class DealUnderContractEvent:
    deal_id: str
    winning_bidder_id: str
    trace_id: str

@dataclass
class DealSettledEvent:
    deal_id: str
    trace_id: str

@dataclass
class DealClosedEvent:
    deal_id: str
    trace_id: str
