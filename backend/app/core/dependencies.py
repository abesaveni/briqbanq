"""
FastAPI dependency injection module.
Provides database sessions, current user extraction, and role enforcement.
"""

import uuid
from typing import AsyncGenerator, Optional

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AccountSuspendedError,
    AuthenticationError,
    InsufficientRoleError,
    TokenBlacklistedError,
)
from app.core.security import decode_token
from app.infrastructure.database import get_db_session
from app.infrastructure.redis import redis_client


async def get_db(request: Request):
    """Get database session dependency."""
    async for session in get_db_session():
        yield session


async def get_trace_id(x_trace_id: Optional[str] = Header(None)) -> str:
    """Extract or generate trace_id for request tracking."""
    return x_trace_id or str(uuid.uuid4())


async def get_current_user(
    request: Request,
) -> dict:
    """
    Extract and validate current user from JWT token.
    Returns decoded token payload with user_id and roles.
    """
    authorization = request.headers.get("authorization") or request.headers.get("Authorization")
    if not authorization:
        raise AuthenticationError(message="Authentication required. Please log in.")
    if not authorization.startswith("Bearer "):
        raise AuthenticationError(message="Invalid authorization header format")

    token = authorization.replace("Bearer ", "")

    # Check token blacklist
    is_blacklisted = await redis_client.get(f"token_blacklist:{token}")
    if is_blacklisted:
        raise TokenBlacklistedError()

    payload = decode_token(token)

    # Check if user is suspended
    is_suspended = await redis_client.get(f"user_suspended:{payload['sub']}")
    if is_suspended:
        raise AccountSuspendedError()

    return {
        "user_id": payload["sub"],
        "roles": payload.get("roles", []),
        "token_type": payload.get("type"),
        "jti": payload.get("jti"),
    }


class RoleRequired:
    """
    Dependency class for role-based access control.
    Usage: Depends(RoleRequired(["ADMIN", "LAWYER"]))
    """

    def __init__(self, required_roles: list[str]):
        self.required_roles = required_roles

    async def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        user_roles = current_user.get("roles", [])
        if not any(role in self.required_roles for role in user_roles):
            raise InsufficientRoleError(
                message=f"One of the following roles is required: {', '.join(self.required_roles)}"
            )
        return current_user
