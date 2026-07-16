"""Alembic environment — async engine, URL from the app settings.

The URL comes from the same place the app reads it (DATABASE_URL via
`app.core.config.settings`), normalized to an async driver by the same helper
the app uses, so migrations always target exactly the database the app runs
against. Tests may override it via `config.set_main_option("sqlalchemy.url", …)`.
"""

import asyncio

from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.pool import NullPool

import app.models  # noqa: F401  (register every model on Base.metadata)
from alembic import context
from app.db.base import Base
from app.db.session import _async_url

config = context.config

if not config.get_main_option("sqlalchemy.url"):
    from app.core.config import settings

    config.set_main_option("sqlalchemy.url", _async_url(settings.database_url))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Emit SQL to stdout instead of executing (alembic --sql)."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=NullPool,
    )
    async with engine.connect() as connection:
        await connection.run_sync(_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
