"""
Documents module — Domain events.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class DocumentUploadedEvent:
    """Emitted when a document is uploaded."""
    document_id: str
    case_id: str
    uploaded_by: str
    trace_id: str


@dataclass
class DocumentApprovedEvent:
    """Emitted when a document is approved."""
    document_id: str
    case_id: str
    reviewer_id: str
    trace_id: str


@dataclass
class DocumentRejectedEvent:
    """Emitted when a document is rejected."""
    document_id: str
    case_id: str
    reviewer_id: str
    reason: Optional[str]
    trace_id: str
