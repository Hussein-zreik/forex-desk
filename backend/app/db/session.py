from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base


def _async_url(url: str) -> str:
    """Normalize a DB URL to an async driver.

    Managed Postgres providers (e.g. Render) hand back a sync `postgresql://`
    (or legacy `postgres://`) URL; SQLAlchemy's async engine needs the asyncpg
    driver. SQLite already uses the async `sqlite+aiosqlite://` form locally.
    """
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(_async_url(settings.database_url), future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async DB session."""
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create tables for any model registered on Base.metadata.

    Dev/test convenience only: outside dev the schema is owned by Alembic
    (`alembic upgrade head` runs before the server starts — see Dockerfile),
    because `create_all` can only add brand-new tables, never evolve existing
    ones.
    """
    if settings.environment != "dev":
        return
    import app.models  # noqa: F401  (register models)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
