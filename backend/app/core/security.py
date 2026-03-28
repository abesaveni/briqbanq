"""
Security module for JWT token management and password hashing.
- JWT access tokens (short-lived)
- Refresh tokens (rotatable)
- bcrypt password hashing
- Token blacklist support
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.constants import (
    PASSWORD_MIN_LENGTH,
    PASSWORD_REQUIRE_DIGIT,
    PASSWORD_REQUIRE_LOWERCASE,
    PASSWORD_REQUIRE_SPECIAL,
    PASSWORD_REQUIRE_UPPERCASE,
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_REFRESH,
)
from app.core.exceptions import (
    PasswordValidationError,
    TokenExpiredError,
)

# Using bcrypt directly to avoid passlib bug with some versions/environments
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    validate_password_strength(password)
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def validate_password_strength(password: str) -> None:
    """
    Validate password meets complexity requirements.
    Raises PasswordValidationError if requirements not met.
    """
    errors = []

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")

    if PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")

    if PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")

    if PASSWORD_REQUIRE_DIGIT and not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")

    if PASSWORD_REQUIRE_SPECIAL and not any(
        c in "!@#$%^&*()-_=+[]{}|;:',.<>?/`~" for c in password
    ):
        errors.append("Password must contain at least one special character")

    if errors:
        raise PasswordValidationError(message="; ".join(errors))


def create_access_token(
    user_id: str,
    roles: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    payload = {
        "sub": user_id,
        "roles": roles,
        "type": TOKEN_TYPE_ACCESS,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(days=settings.jwt_refresh_token_expire_days)
    )
    payload = {
        "sub": user_id,
        "type": TOKEN_TYPE_REFRESH,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises TokenExpiredError if token is expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return dict(payload)
    except JWTError as e:
        if "expired" in str(e).lower():
            raise TokenExpiredError()
        raise TokenExpiredError(message="Invalid token")
