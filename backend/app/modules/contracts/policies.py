"""Contracts module — Policies."""
from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType

class ContractPolicy:
    @staticmethod
    def can_create_contract(current_user: dict) -> bool:
        allowed = [RoleType.ADMIN.value, RoleType.LAWYER.value]
        if not any(r in current_user.get("roles", []) for r in allowed):
            raise AuthorizationError(message="Only admins and lawyers can create contracts")
        return True

    @staticmethod
    def can_execute_contract(current_user: dict) -> bool:
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(message="Only administrators can execute contracts")
        return True
