"""
Admin module — Service layer.
Platform settings management and admin dashboard.
"""

import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceConflictError, ResourceNotFoundError
from app.modules.admin.models import PlatformSetting
from app.modules.admin.repository import AdminRepository


# Default platform settings to be seeded on first run
DEFAULT_SETTINGS = [
    {
        "key": "escrow_mode",
        "value": "INTERNAL",
        "description": "Escrow processing mode: INTERNAL or EXTERNAL",
        "category": "financial",
    },
    {
        "key": "auto_convert_no_bid",
        "value": "true",
        "description": "Automatically convert auctions with no bids",
        "category": "auction",
    },
    {
        "key": "kyc_required_roles",
        "value": "INVESTOR,LENDER",
        "description": "Comma-separated roles that require KYC verification",
        "category": "compliance",
    },
    {
        "key": "approval_sla_hours",
        "value": "6",
        "description": "SLA hours for admin approval actions",
        "category": "operations",
    },
]


class AdminService:
    """Service layer for admin operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AdminRepository(db)

    async def seed_default_settings(self) -> List[PlatformSetting]:
        """Seed default platform settings if they don't exist."""
        created = []
        for setting_data in DEFAULT_SETTINGS:
            existing = await self.repository.get_setting_by_key(setting_data["key"])
            if not existing:
                setting = PlatformSetting(**setting_data)
                setting = await self.repository.create_setting(setting)
                created.append(setting)
        return created

    async def create_setting(
        self,
        key: str,
        value: str,
        description: Optional[str],
        category: Optional[str],
        trace_id: str,
    ) -> PlatformSetting:
        """Create a new platform setting."""
        existing = await self.repository.get_setting_by_key(key)
        if existing:
            raise ResourceConflictError(
                message=f"Setting with key '{key}' already exists"
            )

        setting = PlatformSetting(
            key=key,
            value=value,
            description=description,
            category=category,
        )
        return await self.repository.create_setting(setting)

    async def update_setting(
        self,
        key: str,
        value: str,
        description: Optional[str],
        trace_id: str,
    ) -> PlatformSetting:
        """Update an existing platform setting."""
        setting = await self.repository.get_setting_by_key(key)
        if not setting:
            raise ResourceNotFoundError(
                message=f"Setting with key '{key}' not found"
            )

        setting.value = value  # type: ignore[assignment]
        if description is not None:
            setting.description = description  # type: ignore[assignment]

        return await self.repository.update_setting(setting)

    async def get_setting(self, key: str) -> str:
        """Get a setting value by key (runtime read)."""
        setting = await self.repository.get_setting_by_key(key)
        if not setting:
            raise ResourceNotFoundError(
                message=f"Setting with key '{key}' not found"
            )
        return setting.value

    async def get_all_settings(
        self, category: Optional[str] = None
    ) -> List[PlatformSetting]:
        """Get all platform settings."""
        return await self.repository.get_all_settings(category)

    async def delete_setting(self, key: str, trace_id: str) -> None:
        """Delete a platform setting."""
        setting = await self.repository.get_setting_by_key(key)
        if not setting:
            raise ResourceNotFoundError(
                message=f"Setting with key '{key}' not found"
            )
        await self.repository.delete_setting(setting)

    async def get_platform_stats(self) -> dict:
        """Get platform statistics."""
        from app.modules.identity.repository import UserRepository
        from app.modules.cases.repository import CaseRepository
        from app.modules.auctions.repository import AuctionRepository
        from app.shared.enums import AuctionStatus, UserStatus, KYCStatus

        user_repo = UserRepository(self.db)
        case_repo = CaseRepository(self.db)

        total_users = await user_repo.count()
        active_users = await user_repo.count(status=UserStatus.ACTIVE)
        suspended_users = await user_repo.count(status=UserStatus.SUSPENDED)
        total_cases = await case_repo.count()

        try:
            auction_repo = AuctionRepository(self.db)
            live_auctions = await auction_repo.count(status=AuctionStatus.LIVE)
        except Exception:
            live_auctions = 0

        try:
            from sqlalchemy import select, func as sqlfunc
            from app.modules.kyc.models import KYCRecord
            result = await self.db.execute(
                select(sqlfunc.count()).where(KYCRecord.status == KYCStatus.SUBMITTED)
            )
            pending_approvals = result.scalar() or 0
        except Exception:
            pending_approvals = 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "suspended_users": suspended_users,
            "total_cases": total_cases,
            "live_auctions": live_auctions,
            "pending_approvals": pending_approvals,
            "total_investments": 100,  # Mocked
            "platform_revenue": 50000.0,  # Mocked
        }
