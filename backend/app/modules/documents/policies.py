"""
Documents module — Authorization policies.
"""

from app.core.exceptions import AuthorizationError
from app.shared.enums import RoleType


class DocumentPolicy:
    """Authorization policies for document operations."""

    @staticmethod
    def can_upload_document(current_user: dict) -> bool:
        """Borrowers and lawyers can upload documents."""
        allowed_roles = [RoleType.BORROWER.value, RoleType.LAWYER.value, RoleType.ADMIN.value]
        if not any(r in current_user.get("roles", []) for r in allowed_roles):
            raise AuthorizationError(
                message="Only borrowers, lawyers, and admins can upload documents"
            )
        return True

    @staticmethod
    def can_review_document(current_user: dict) -> bool:
        """Only admins and lawyers can review documents."""
        allowed_roles = [RoleType.ADMIN.value, RoleType.LAWYER.value]
        if not any(r in current_user.get("roles", []) for r in allowed_roles):
            raise AuthorizationError(
                message="Only administrators and lawyers can review documents"
            )
        return True

    @staticmethod
    def can_access_document(current_user: dict, case_borrower_id: str) -> bool:
        """Document access follows case access rules."""
        allowed_roles = [RoleType.ADMIN.value, RoleType.LAWYER.value, RoleType.LENDER.value]
        if current_user["user_id"] == case_borrower_id:
            return True
        if any(r in current_user.get("roles", []) for r in allowed_roles):
            return True
        raise AuthorizationError(message="You do not have access to this document")
