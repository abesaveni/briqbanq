"""Bids module — Policies."""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType

class BidPolicy:
    @staticmethod
    def can_place_bid(current_user: dict) -> bool:
        """Investors, lenders, lawyers, and admins can bid."""
        allowed = {RoleType.INVESTOR.value, RoleType.LENDER.value, RoleType.LAWYER.value, RoleType.ADMIN.value}
        if not allowed.intersection(set(current_user.get("roles", []))):
            raise AuthorizationError(message="Only investors, lenders, lawyers or admins can place bids")
        return True

    @staticmethod
    def can_view_bids(current_user: dict) -> bool:
        return True
