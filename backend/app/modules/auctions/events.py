"""Auctions module — Domain events."""
from dataclasses import dataclass

@dataclass
class AuctionCreatedEvent:
    auction_id: str; deal_id: str; trace_id: str

@dataclass
class AuctionStartedEvent:
    auction_id: str; trace_id: str

@dataclass
class AuctionPausedEvent:
    auction_id: str; trace_id: str

@dataclass
class AuctionEndedEvent:
    auction_id: str; winning_bid_id: str; trace_id: str
