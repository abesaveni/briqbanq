"""Auctions module — Policies."""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType

class AuctionPolicy:
    @staticmethod
    def can_manage_auction(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can manage auctions")
        return True

    @staticmethod
    def can_view_auction(current_user: dict) -> bool:
        return True
