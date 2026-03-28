"""
Identity module — Domain events.
Notification and async job triggers.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class UserRegisteredEvent:
    """Emitted when a new user registers."""
    user_id: str
    email: str
    requested_roles: List[str]
    trace_id: str


@dataclass
class UserLoggedInEvent:
    """Emitted when a user logs in."""
    user_id: str
    trace_id: str


@dataclass
class UserSuspendedEvent:
    """Emitted when a user is suspended."""
    user_id: str
    admin_id: str
    trace_id: str


@dataclass
class UserReactivatedEvent:
    """Emitted when a suspended user is reactivated."""
    user_id: str
    admin_id: str
    trace_id: str


@dataclass
class PasswordChangedEvent:
    """Emitted when a user changes their password."""
    user_id: str
    trace_id: str
