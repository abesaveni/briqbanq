"""
Audit module — Authorization policies.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class AuditPolicy:
    """Authorization policies for audit log access."""

    @staticmethod
    def can_view_audit_logs(current_user: dict) -> bool:
        """Only admins can view audit logs."""
        if RoleType.ADMIN.value not in current_user.get("roles", []):
            raise AuthorizationError(
                message="Only administrators can view audit logs"
            )
        return True
