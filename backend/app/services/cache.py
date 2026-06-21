from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market import DataCache


async def get_cached(
    db: AsyncSession,
    key: str,
    ttl_seconds: int,
    fetch_fn: Callable[[], Awaitable[Any]],
) -> Any:
    """Return cached payload within TTL, else fetch, store, and return it."""
    row = await db.get(DataCache, key)
    if row is not None:
        updated = row.updated_at
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=UTC)
        if datetime.now(UTC) - updated < timedelta(seconds=ttl_seconds):
            return row.payload

    data = await fetch_fn()
    if row is not None:
        row.payload = data
        row.updated_at = datetime.now(UTC)
    else:
        db.add(DataCache(key=key, payload=data))
    await db.commit()
    return data
