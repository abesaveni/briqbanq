"""Wallet module — Policies."""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType

class WalletPolicy:
    @staticmethod
    def can_view_wallet(current_user: dict, wallet_user_id: str) -> bool:
        if current_user["user_id"] == wallet_user_id:
            return True
        if RoleType.ADMIN.value in current_user.get("roles", []):
            return True
        raise AuthorizationError(message="You can only view your own wallet")

    @staticmethod
    def can_manage_wallets(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can manage wallets")
        return True
