"""
Database infrastructure module.
Provides async SQLAlchemy engine, session factory, and base model.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# SQLite does not support pool_size / max_overflow — detect and configure accordingly
_is_sqlite = settings.database_url.startswith("sqlite")

_engine_kwargs: dict = dict(echo=settings.debug)
if not _is_sqlite:
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 10
    _engine_kwargs["pool_pre_ping"] = True
else:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

# Async engine
engine = create_async_engine(
    settings.database_url,
    **_engine_kwargs,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db_session():
    """Yield an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    # Import ALL models here to ensure they are registered with Base.metadata
    import app.modules.identity.models
    import app.modules.roles.models
    import app.modules.documents.models
    import app.modules.cases.models
    import app.modules.kyc.models
    import app.modules.tasks.models
    import app.modules.admin.models
    import app.modules.audit.models
    import app.modules.notifications.models
    import app.modules.wallet.models
    import app.modules.deals.models
    import app.modules.auctions.models
    import app.modules.bids.models
    import app.modules.escrow.models
    import app.modules.contracts.models
    import app.modules.settlement.models
    import app.modules.platform.models
    import app.modules.communications.models

    print(f"Initializing database... Tables: {list(Base.metadata.tables.keys())}")
    async with engine.begin() as conn:
        try:
            await conn.run_sync(Base.metadata.create_all)
            print("Database initialization SUCCESS.")
        except Exception as e:
            err_str = str(e)
            if "already exists" in err_str or "UniqueViolationError" in err_str or "DuplicateTable" in err_str:
                print("Database init: skipping (already initialized by another worker).")
            else:
                print(f"Database initialization ERROR: {e}")
                raise


async def close_db():
    """Close database connections."""
    await engine.dispose()
