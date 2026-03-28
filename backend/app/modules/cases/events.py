"""
Cases module — Domain events.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CaseCreatedEvent:
    """Emitted when a new case is created."""
    case_id: str
    borrower_id: str
    trace_id: str


@dataclass
class CaseSubmittedEvent:
    """Emitted when a case is submitted for review."""
    case_id: str
    borrower_id: str
    trace_id: str


@dataclass
class CaseApprovedEvent:
    """Emitted when a case is approved."""
    case_id: str
    reviewer_id: str
    trace_id: str


@dataclass
class CaseRejectedEvent:
    """Emitted when a case is rejected."""
    case_id: str
    reviewer_id: str
    reason: Optional[str]
    trace_id: str


@dataclass
class CaseListedEvent:
    """Emitted when a case is listed for auction."""
    case_id: str
    trace_id: str


@dataclass
class CaseClosedEvent:
    """Emitted when a case is closed."""
    case_id: str
    trace_id: str
