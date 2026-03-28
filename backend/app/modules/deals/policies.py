"""
Deals module — Authorization policies.
"""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class DealPolicy:
    @staticmethod
    def can_create_deal(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can create deals")
        return True

    @staticmethod
    def can_manage_deal(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can manage deals")
        return True

    @staticmethod
    def can_view_deals(current_user: dict) -> bool:
        """Any authenticated user can view listed deals."""
        return True
