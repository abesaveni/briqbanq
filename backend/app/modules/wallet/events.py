"""Wallet module — Domain events."""
from dataclasses import dataclass

@dataclass
class WalletCreatedEvent:
    wallet_id: str; user_id: str; trace_id: str

@dataclass
class FundsDepositedEvent:
    wallet_id: str; amount: str; trace_id: str

@dataclass
class FundsTransferredEvent:
    from_wallet_id: str; to_wallet_id: str; amount: str; transaction_type: str; trace_id: str
