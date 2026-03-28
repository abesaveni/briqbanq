"""
Admin module — Domain events.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class SettingUpdatedEvent:
    """Emitted when a platform setting is updated."""
    key: str
    old_value: str
    new_value: str
    updated_by: str
    trace_id: str
