"""
Audit module — Domain events.
"""

from dataclasses import dataclass


@dataclass
class AuditLogCreatedEvent:
    """Internal event for audit log creation tracking."""
    audit_log_id: str
    entity_type: str
    entity_id: str
    action: str
    trace_id: str
