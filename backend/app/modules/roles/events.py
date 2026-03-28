"""
Roles module — Domain events.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class RoleRequestedEvent:
    """Emitted when a user requests a role."""
    user_id: str
    role_type: str
    trace_id: str


@dataclass
class RoleApprovedEvent:
    """Emitted when a role is approved."""
    user_id: str
    role_type: str
    approved_by: str
    trace_id: str


@dataclass
class RoleRejectedEvent:
    """Emitted when a role is rejected."""
    user_id: str
    role_type: str
    rejected_by: str
    reason: Optional[str]
    trace_id: str


@dataclass
class RoleRevokedEvent:
    """Emitted when a role is revoked."""
    user_id: str
    role_type: str
    revoked_by: str
    trace_id: str
