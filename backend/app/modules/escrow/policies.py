"""Escrow module — Policies."""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType

class EscrowPolicy:
    @staticmethod
    def can_manage_escrow(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can manage escrows")
        return True
