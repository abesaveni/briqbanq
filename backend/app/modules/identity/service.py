"""
Identity module — Service layer.
Contains ALL business logic for user management.
- Registration with role requests
- Authentication (login/logout)
- Token management
- Profile updates
- Audit logging triggers
"""

import uuid
import random
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AUDIT_ACTION_CREATE, AUDIT_ACTION_LOGIN, AUDIT_ACTION_LOGOUT, AUDIT_ACTION_UPDATE
from app.core.exceptions import (
    AccountSuspendedError,
    DuplicateEmailError,
    InvalidCredentialsError,
    ResourceNotFoundError,
    TokenBlacklistedError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.config import settings
from app.infrastructure.redis import redis_client
from app.infrastructure.email_service import EmailService
from app.modules.identity.models import User
from app.modules.identity.repository import UserRepository
from app.modules.identity.schemas import (
    AuthTokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserRegisterRequest,
    UserUpdateRequest,
    OTPSendRequest,
    OTPVerifyRequest,
)
from app.shared.enums import RoleType, UserStatus


class UserService:
    """Service layer for user management business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = UserRepository(db)

    async def send_otp(self, email: str) -> None:
        """
        Generate and send a 6-digit OTP.
        - Checks if user already exists
        - Generates random 6-digit OTP
        - Stores in Redis for 5 minutes
        - Mocks email sending
        """
        # Check if user already exists
        existing_user = await self.repository.get_by_email(email)
        if existing_user:
            raise DuplicateEmailError(message="User already exists with this email")

        # Generate 6-digit OTP
        import random
        otp = str(random.randint(100000, 999999))
        
        # Store in Redis: Key = otp:{email}, Expiry = 10 mins (600s)
        await redis_client.set(f"otp:{email}", otp, expire=600)
        
        # Reset attempts counter
        await redis_client.set(f"otp_attempts:{email}", "0", expire=600)

        import structlog
        log = structlog.get_logger()
        log.info("otp_generated", email=email, otp=otp, expiry=600)

        # Send real email via SMTP
        try:
            await EmailService.send_otp_email(email, otp)
        except Exception as e:
            log.warning("otp_email_failed_continuing", email=email, error=str(e))

        return otp

    async def verify_otp_and_register(
        self,
        request: OTPVerifyRequest,
        trace_id: str,
    ) -> User:
        """
        Verify OTP and create user.
        - Validates OTP matches and not expired
        - Checks max attempts (3)
        - Calls registration logic if valid
        - Deletes OTP from Redis
        """
        # 1. Check attempts
        attempts_key = f"otp_attempts:{request.email}"
        attempts_str = await redis_client.get(attempts_key)
        attempts = int(attempts_str) if attempts_str else 0
        
        if attempts >= 3:
            raise InvalidCredentialsError(message="Maximum OTP attempts exceeded. Please request a new one.")

        # 2. Check OTP
        otp_key = f"otp:{request.email}"
        stored_otp = await redis_client.get(otp_key)
        
        import structlog
        log = structlog.get_logger()
        log.info("otp_verification_attempt", 
                 email=request.email, 
                 entered_otp=request.otp, 
                 stored_otp=stored_otp,
                 match=(stored_otp == request.otp))

        if not stored_otp:
            raise InvalidCredentialsError(message="OTP expired or not found. Please resend.")

        if stored_otp != request.otp:
            # Increment attempts
            await redis_client.incr(attempts_key)
            raise InvalidCredentialsError(message=f"Invalid OTP. {2 - attempts} attempts remaining.")

        # 3. OTP is valid - register user
        # Support first_name/last_name OR full_name from frontend
        first_name = request.get_first_name()
        last_name = request.get_last_name() or "User"
        full_name = request.full_name or f"{first_name} {last_name}".strip()

        # Adapt request for register_user call
        reg_request = UserRegisterRequest(
            email=request.email,
            password=request.password,
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
            phone=request.phone,
            requested_roles=[request.role.upper()]
        )
        
        user = await self.register_user(reg_request, trace_id)
        
        # Add role to the response object (it's in the schema now)
        setattr(user, "role", request.role.lower())
        
        # 4. Generate tokens for auto-login
        # At this point the user is newly created, so we can just use the role they selected
        access_token = create_access_token(
            user_id=str(user.id),
            roles=[request.role.upper()],
        )
        refresh_token = create_refresh_token(user_id=str(user.id))
        
        tokens = AuthTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

        # 5. Cleanup Redis
        await redis_client.delete(f"otp:{request.email}")
        await redis_client.delete(attempts_key)

        # 6. Send welcome email
        try:
            await EmailService.send_welcome_email(
                to_email=user.email,
                name=f"{first_name} {last_name}".strip() or user.email,
                role=request.role,
            )
        except Exception as e:
            import structlog
            structlog.get_logger().warning("welcome_email_failed", email=user.email, error=str(e))

        return user, tokens

    async def send_reset_otp(self, email: str) -> None:
        """Send a password-reset OTP. The user MUST already exist."""
        import structlog
        log = structlog.get_logger()

        user = await self.repository.get_by_email(email)
        if not user:
            # Don't reveal whether the email is registered — silently succeed
            log.info("reset_otp_email_not_found_silent", email=email)
            return

        otp = str(random.randint(100000, 999999))
        await redis_client.set(f"reset_otp:{email}", otp, expire=600)
        await redis_client.set(f"reset_otp_attempts:{email}", "0", expire=600)

        log.info("reset_otp_generated", email=email, otp=otp)

        try:
            await EmailService.send_password_reset_email(email, otp)
        except Exception as e:
            log.warning("reset_otp_email_failed_continuing", email=email, error=str(e))

    async def reset_password(self, email: str, otp: str, new_password: str) -> None:
        """Verify reset OTP and update the user's password."""
        attempts_key = f"reset_otp_attempts:{email}"
        attempts_str = await redis_client.get(attempts_key)
        attempts = int(attempts_str) if attempts_str else 0

        if attempts >= 5:
            raise InvalidCredentialsError(message="Too many attempts. Please request a new reset code.")

        stored_otp = await redis_client.get(f"reset_otp:{email}")
        if not stored_otp:
            raise InvalidCredentialsError(message="Reset code expired or not found. Please request a new one.")

        if stored_otp != otp:
            await redis_client.incr(attempts_key)
            raise InvalidCredentialsError(message=f"Invalid code. {4 - attempts} attempts remaining.")

        user = await self.repository.get_by_email(email)
        if not user:
            raise ResourceNotFoundError(message="User not found")

        user.hashed_password = hash_password(new_password)
        await self.repository.update(user)

        await redis_client.delete(f"reset_otp:{email}")
        await redis_client.delete(attempts_key)

    async def register_user(
        self,
        request: UserRegisterRequest,
        trace_id: str,
    ) -> User:
        """
        Register a new user.
        - Validates unique email
        - Hashes password
        - Creates user record
        - Creates role requests (handled by roles module)
        - Logs audit event
        """
        # Check for duplicate email
        existing_user = await self.repository.get_by_email(request.email)
        if existing_user:
            raise DuplicateEmailError()

        # Hash password (validates strength internally)
        hashed_password = hash_password(request.password)

        # Create user entity
        user = User(
            email=request.email,
            hashed_password=hashed_password,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            status=UserStatus.ACTIVE,
        )

        user = await self.repository.create(user)

        # Create role requests (deferred to roles service in routes)
        # Audit logging (deferred to audit service in routes)

        return user

    async def authenticate(
        self, email: str, password: str, trace_id: str
    ) -> AuthTokenResponse:
        """
        Authenticate user and return tokens.
        - Validates credentials
        - Checks account status
        - Generates JWT tokens
        """
        user = await self.repository.get_by_email(email)
        if not user:
            raise InvalidCredentialsError()

        if user.status.value == UserStatus.SUSPENDED.value:  # type: ignore[attr-defined]
            raise AccountSuspendedError()

        if not verify_password(password, user.hashed_password):  # type: ignore[arg-type]
            raise InvalidCredentialsError()

        # Get approved roles
        approved_roles = []
        if user.user_roles:
            from app.shared.enums import RoleStatus
            approved_roles = [
                ur.role_type.value
                for ur in user.user_roles
                if ur.status == RoleStatus.APPROVED
            ]

        # Generate tokens
        access_token = create_access_token(
            user_id=str(user.id),
            roles=approved_roles,
        )
        refresh_token = create_refresh_token(user_id=str(user.id))

        return AuthTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def refresh_tokens(self, refresh_token: str) -> AuthTokenResponse:
        """
        Refresh access token using a valid refresh token.
        - Validates refresh token
        - Checks blacklist
        - Issues new token pair
        - Blacklists old refresh token
        """
        # Check blacklist
        is_blacklisted = await redis_client.get(f"token_blacklist:{refresh_token}")
        if is_blacklisted:
            raise TokenBlacklistedError()

        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise InvalidCredentialsError(message="Invalid token type")

        user_id = payload["sub"]
        user = await self.repository.get_by_id(uuid.UUID(user_id))
        if not user:
            raise ResourceNotFoundError(message="User not found")

        if user.status.value == UserStatus.SUSPENDED.value:  # type: ignore[attr-defined]
            raise AccountSuspendedError()

        # Get approved roles
        approved_roles = []
        if user.user_roles:
            from app.shared.enums import RoleStatus
            approved_roles = [
                ur.role_type.value
                for ur in user.user_roles
                if ur.status == RoleStatus.APPROVED
            ]

        # Blacklist old refresh token
        await redis_client.set(
            f"token_blacklist:{refresh_token}",
            "1",
            expire=settings.jwt_refresh_token_expire_days * 86400,
        )

        # Generate new tokens
        new_access_token = create_access_token(
            user_id=user_id,
            roles=approved_roles,
        )
        new_refresh_token = create_refresh_token(user_id=user_id)

        return AuthTokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def logout(self, token: str, jti: str) -> None:
        """
        Logout user by blacklisting their token.
        """
        await redis_client.set(
            f"token_blacklist:{token}",
            "1",
            expire=settings.jwt_access_token_expire_minutes * 60,
        )

    async def get_user(self, user_id: uuid.UUID) -> User:
        """Get user by ID."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(message="User not found")
        return user

    async def get_user_by_email(self, email: str) -> User:
        """Get user by email."""
        user = await self.repository.get_by_email(email)
        if not user:
            raise ResourceNotFoundError(message="User not found")
        return user

    async def update_profile(
        self,
        user_id: uuid.UUID,
        request: UserUpdateRequest,
        trace_id: str,
    ) -> User:
        """Update user profile."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(message="User not found")

        if request.first_name:
            user.first_name = request.first_name  # type: ignore[assignment]
        if request.last_name:
            user.last_name = request.last_name  # type: ignore[assignment]
        if request.phone is not None:
            user.phone = request.phone  # type: ignore[assignment]

        return await self.repository.update(user)

    async def change_password(
        self,
        user_id: uuid.UUID,
        request: ChangePasswordRequest,
        trace_id: str,
    ) -> None:
        """Change user password."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(message="User not found")

        if not verify_password(request.current_password, user.hashed_password):  # type: ignore[arg-type]
            raise InvalidCredentialsError(message="Current password is incorrect")

        user.hashed_password = hash_password(request.new_password)  # type: ignore[assignment]
        await self.repository.update(user)

    async def suspend_user(self, user_id: uuid.UUID, trace_id: str) -> User:
        """Suspend a user account."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(message="User not found")

        user.status = UserStatus.SUSPENDED  # type: ignore[assignment]
        await self.repository.update(user)

        # Cache suspension status for fast auth checks
        await redis_client.set(f"user_suspended:{user_id}", "1")

        return user

    async def reactivate_user(self, user_id: uuid.UUID, trace_id: str) -> User:
        """Reactivate a suspended user account."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(message="User not found")

        user.status = UserStatus.ACTIVE  # type: ignore[assignment]
        await self.repository.update(user)

        # Remove suspension cache
        await redis_client.delete(f"user_suspended:{user_id}")

        return user

    async def get_all_users(
        self, offset: int = 0, limit: int = 20, status: Optional[UserStatus] = None
    ) -> List[User]:
        """Get all users with pagination."""
        return await self.repository.get_all(offset=offset, limit=limit, status=status)
