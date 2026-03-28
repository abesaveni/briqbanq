"""Notifications module — Events."""
from dataclasses import dataclass

@dataclass
class NotificationSentEvent:
    notification_id: str; user_id: str; channel: str; trace_id: str
