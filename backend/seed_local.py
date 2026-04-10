"""
Seed script for local development.
Creates test users for every role so you can log in immediately.
"""
import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
print(f"Using DB: {settings.database_url}")

from app.infrastructure.database import engine, async_session_factory, init_db
from app.modules.identity.models import User
from app.modules.roles.models import UserRole
from app.shared.enums import UserStatus, RoleType, RoleStatus

import bcrypt as _bcrypt

def _hash(pw: str) -> str:
    return _bcrypt.hashpw(pw.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

TEST_USERS = [
    {
        "email": "admin@brickbanq.com",
        "password": "Admin@123",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "phone": "+61400000001",
    },
    {
        "email": "borrower@brickbanq.com",
        "password": "Borrower@123",
        "first_name": "Borrower",
        "last_name": "User",
        "role": "borrower",
        "phone": "+61400000002",
    },
    {
        "email": "lender@brickbanq.com",
        "password": "Lender@123",
        "first_name": "Lender",
        "last_name": "User",
        "role": "lender",
        "phone": "+61400000003",
    },
    {
        "email": "investor@brickbanq.com",
        "password": "Investor@123",
        "first_name": "Investor",
        "last_name": "User",
        "role": "investor",
        "phone": "+61400000004",
    },
    {
        "email": "lawyer@brickbanq.com",
        "password": "Lawyer@123",
        "first_name": "Lawyer",
        "last_name": "User",
        "role": "lawyer",
        "phone": "+61400000005",
    },
]

ROLE_MAP = {
    "admin": RoleType.ADMIN,
    "borrower": RoleType.BORROWER,
    "lender": RoleType.LENDER,
    "investor": RoleType.INVESTOR,
    "lawyer": RoleType.LAWYER,
}

async def seed():
    await init_db()

    async with async_session_factory() as session:
        from sqlalchemy import select

        for u in TEST_USERS:
            # Check if exists
            result = await session.execute(
                select(User).where(User.email == u["email"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                existing.hashed_password = _hash(u["password"])
                existing.status = UserStatus.ACTIVE
                await session.flush()
                print(f"  UPDATED password: {u['email']}")
                continue

            user = User(
                id=uuid.uuid4(),
                email=u["email"],
                hashed_password=_hash(u["password"]),
                first_name=u["first_name"],
                last_name=u["last_name"],
                phone=u.get("phone"),
                status=UserStatus.ACTIVE,
            )
            session.add(user)
            await session.flush()  # get user.id

            role_type = ROLE_MAP.get(u["role"])
            if role_type:
                role = UserRole(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    role_type=role_type,
                    status=RoleStatus.APPROVED,
                )
                session.add(role)

            print(f"  CREATED: {u['email']} / {u['password']}  [{u['role']}]")

        await session.commit()
        print("\nSeeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
