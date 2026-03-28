"""Bids module — Domain events."""
from dataclasses import dataclass

@dataclass
class BidPlacedEvent:
    bid_id: str; auction_id: str; bidder_id: str; amount: str; trace_id: str

@dataclass
class BidOutbidEvent:
    bid_id: str; auction_id: str; bidder_id: str; trace_id: str

@dataclass
class BidWonEvent:
    bid_id: str; auction_id: str; bidder_id: str; amount: str; trace_id: str

@dataclass
class BidDefaultedEvent:
    bid_id: str; auction_id: str; bidder_id: str; trace_id: str
