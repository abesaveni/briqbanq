"""
Admin module — Authorization policies.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class AdminPolicy:
    """Authorization policies for admin operations."""

    @staticmethod
    def can_manage_settings(current_user: dict) -> bool:
        """Only admins can manage platform settings."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can manage platform settings"
            )
        return True

    @staticmethod
    def can_view_dashboard(current_user: dict) -> bool:
        """Admins and lawyers can view the admin dashboard."""
        allowed = [RoleType.ADMIN.value, RoleType.LAWYER.value]
        if not any(r in allowed for r in current_user.get("roles", [])):
            raise AuthorizationError(
                message="Only administrators and lawyers can view the dashboard"
            )
        return True
