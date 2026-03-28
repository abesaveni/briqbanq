"""
Roles module — Authorization policies.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class RolePolicy:
    """Authorization policies for role management."""

    @staticmethod
    def can_approve_role(current_user: dict) -> bool:
        """Only admins can approve roles."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can approve role requests"
            )
        return True

    @staticmethod
    def can_reject_role(current_user: dict) -> bool:
        """Only admins can reject roles."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can reject role requests"
            )
        return True

    @staticmethod
    def can_revoke_role(current_user: dict) -> bool:
        """Only admins can revoke roles."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can revoke roles"
            )
        return True

    @staticmethod
    def can_view_pending_roles(current_user: dict) -> bool:
        """Only admins can view pending roles."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can view pending role requests"
            )
        return True
