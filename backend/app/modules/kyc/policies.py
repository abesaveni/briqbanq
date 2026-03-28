"""
KYC module — Authorization policies.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class KYCPolicy:
    """Authorization policies for KYC operations."""

    @staticmethod
    def can_review_kyc(current_user: dict) -> bool:
        """Admins and lawyers can review KYC submissions."""
        allowed = [RoleType.ADMIN.value, RoleType.LAWYER.value]
        if not any(r in allowed for r in current_user.get("roles", [])):
            raise AuthorizationError(
                message="Only administrators and lawyers can review KYC submissions"
            )
        return True

    @staticmethod
    def can_view_kyc(current_user: dict, target_user_id: str) -> bool:
        """Users can view their own KYC; admins can view any."""
        if current_user["user_id"] == target_user_id:
            return True
        if RoleType.ADMIN.value in current_user.get("roles", []):
            return True
        raise AuthorizationError(
            message="You can only view your own KYC records"
        )
