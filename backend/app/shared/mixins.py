"""
Shared mixins for common patterns across modules.
"""

from typing import Any, Optional


class PaginationMixin:
    """Mixin for paginated query results."""

    @staticmethod
    def paginate_params(page: int = 1, page_size: int = 20) -> dict:
        """Calculate offset and limit from page parameters."""
        from app.core.constants import MAX_PAGE_SIZE
        page_size = min(page_size, MAX_PAGE_SIZE)
        offset = (page - 1) * page_size
        return {"offset": offset, "limit": page_size}


class StateMachineMixin:
    """
    Mixin for state machine enforcement.
    Subclasses must define VALID_TRANSITIONS as a dict mapping current state to allowed next states.
    """

    VALID_TRANSITIONS: dict[str, list[str]] = {}

    @classmethod
    def validate_transition(cls, current_state: str, new_state: str) -> bool:
        """Check if a state transition is valid."""
        from app.core.exceptions import InvalidStateTransitionError
        allowed = cls.VALID_TRANSITIONS.get(current_state, [])
        if new_state not in allowed:
            raise InvalidStateTransitionError(
                message=f"Cannot transition from {current_state} to {new_state}. "
                        f"Allowed transitions: {', '.join(allowed) if allowed else 'none'}"
            )
        return True
