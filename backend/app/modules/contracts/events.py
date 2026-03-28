"""Contracts module — Events."""
from dataclasses import dataclass

@dataclass
class ContractCreatedEvent:
    contract_id: str; deal_id: str; trace_id: str
@dataclass
class ContractSignedEvent:
    contract_id: str; signer_id: str; trace_id: str
@dataclass
class ContractFullySignedEvent:
    contract_id: str; trace_id: str
@dataclass
class ContractExecutedEvent:
    contract_id: str; deal_id: str; trace_id: str
