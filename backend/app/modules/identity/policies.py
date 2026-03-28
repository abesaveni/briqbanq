"""
Identity module — Authorization policies.
Role-based access logic only. No database writes.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class IdentityPolicy:
    """Authorization policies for identity operations."""

    @staticmethod
    def can_view_all_users(current_user: dict) -> bool:
        """Only admins can view all users."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can view all users"
            )
        return True

    @staticmethod
    def can_suspend_user(current_user: dict) -> bool:
        """Only admins can suspend users."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can suspend users"
            )
        return True

    @staticmethod
    def can_view_user_profile(current_user: dict, target_user_id: str) -> bool:
        """Users can view their own profile; admins can view any."""
        if current_user["user_id"] == target_user_id:
            return True
        if RoleType.ADMIN.value in current_user.get("roles", []):
            return True
        raise AuthorizationError(
            message="You can only view your own profile"
        )

    @staticmethod
    def can_update_profile(current_user: dict, target_user_id: str) -> bool:
        """Users can update their own profile; admins can update any."""
        if current_user["user_id"] == target_user_id:
            return True
        if RoleType.ADMIN.value in current_user.get("roles", []):
            return True
        raise AuthorizationError(
            message="You can only update your own profile"
        )
