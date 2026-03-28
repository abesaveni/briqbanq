"""
Custom exception classes for standardized error handling.
All exceptions follow the format:
{
    "error_code": "CASE_INVALID_STATE",
    "message": "Case cannot be approved in DRAFT state",
    "trace_id": "uuid"
}
No raw tracebacks in production.
"""

from typing import Optional


class BrickBanqException(Exception):
    """Base exception for all BrickBanq errors."""

    error_code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An internal error occurred"

    def __init__(self, message: Optional[str] = None, error_code: Optional[str] = None):
        self.message = message or self.__class__.message
        self.error_code = error_code or self.__class__.error_code
        super().__init__(self.message)


# ─── Authentication Errors ───────────────────────────────────────────────────

class AuthenticationError(BrickBanqException):
    error_code = "AUTHENTICATION_FAILED"
    status_code = 401
    message = "Authentication failed"


class InvalidCredentialsError(AuthenticationError):
    error_code = "INVALID_CREDENTIALS"
    message = "Invalid email or password"


class TokenExpiredError(AuthenticationError):
    error_code = "TOKEN_EXPIRED"
    message = "Token has expired"


class TokenBlacklistedError(AuthenticationError):
    error_code = "TOKEN_BLACKLISTED"
    message = "Token has been revoked"


class AccountSuspendedError(AuthenticationError):
    error_code = "ACCOUNT_SUSPENDED"
    status_code = 403
    message = "Account has been suspended"


# ─── Authorization Errors ────────────────────────────────────────────────────

class AuthorizationError(BrickBanqException):
    error_code = "AUTHORIZATION_FAILED"
    status_code = 403
    message = "You do not have permission to perform this action"


class InsufficientRoleError(AuthorizationError):
    error_code = "INSUFFICIENT_ROLE"
    message = "You do not have the required role for this action"


class RoleNotApprovedError(AuthorizationError):
    error_code = "ROLE_NOT_APPROVED"
    message = "Your role has not been approved yet"


# ─── Validation Errors ───────────────────────────────────────────────────────

class ValidationError(BrickBanqException):
    error_code = "VALIDATION_ERROR"
    status_code = 422
    message = "Validation failed"


class PasswordValidationError(ValidationError):
    error_code = "PASSWORD_VALIDATION_FAILED"
    message = "Password does not meet requirements"


class DuplicateEmailError(ValidationError):
    error_code = "DUPLICATE_EMAIL"
    status_code = 400
    message = "This email address is already registered. Please sign in or use a different email."


# ─── State Machine Errors ────────────────────────────────────────────────────

class InvalidStateTransitionError(BrickBanqException):
    error_code = "INVALID_STATE_TRANSITION"
    status_code = 409
    message = "Invalid state transition"


# ─── Resource Errors ─────────────────────────────────────────────────────────

class ResourceNotFoundError(BrickBanqException):
    error_code = "RESOURCE_NOT_FOUND"
    status_code = 404
    message = "Resource not found"


class ResourceConflictError(BrickBanqException):
    error_code = "RESOURCE_CONFLICT"
    status_code = 409
    message = "Resource conflict"


class StaleDataError(ResourceConflictError):
    error_code = "STALE_DATA"
    message = "Data has been modified by another request. Please retry."


# ─── Financial Errors ────────────────────────────────────────────────────────

class InsufficientFundsError(BrickBanqException):
    error_code = "INSUFFICIENT_FUNDS"
    status_code = 422
    message = "Insufficient funds"


class EscrowError(BrickBanqException):
    error_code = "ESCROW_ERROR"
    status_code = 422
    message = "Escrow operation failed"


# ─── KYC Errors ──────────────────────────────────────────────────────────────

class KYCRequiredError(BrickBanqException):
    error_code = "KYC_REQUIRED"
    status_code = 403
    message = "KYC verification is required"


class KYCAlreadySubmittedError(BrickBanqException):
    error_code = "KYC_ALREADY_SUBMITTED"
    status_code = 409
    message = "KYC has already been submitted"


# ─── Bid Errors ──────────────────────────────────────────────────────────────

class BidTooLowError(BrickBanqException):
    error_code = "BID_TOO_LOW"
    status_code = 422
    message = "Bid must exceed current highest bid"


class AuctionNotLiveError(BrickBanqException):
    error_code = "AUCTION_NOT_LIVE"
    status_code = 409
    message = "Auction is not currently live"


# ─── Rate Limiting ───────────────────────────────────────────────────────────

class RateLimitExceededError(BrickBanqException):
    error_code = "RATE_LIMIT_EXCEEDED"
    status_code = 429
    message = "Rate limit exceeded. Please try again later."
