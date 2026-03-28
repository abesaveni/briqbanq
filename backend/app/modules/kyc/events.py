"""
KYC module — Domain events.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class KYCSubmittedEvent:
    """Emitted when KYC is submitted."""
    user_id: str
    kyc_id: str
    trace_id: str


@dataclass
class KYCApprovedEvent:
    """Emitted when KYC is approved."""
    user_id: str
    kyc_id: str
    reviewer_id: str
    trace_id: str


@dataclass
class KYCRejectedEvent:
    """Emitted when KYC is rejected."""
    user_id: str
    kyc_id: str
    reviewer_id: str
    reason: Optional[str]
    trace_id: str
