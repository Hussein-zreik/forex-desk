from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market import QuoteCache
from app.services import yahoo

CACHE_TTL = timedelta(seconds=15)


async def get_quote(db: AsyncSession, symbol: str, *, force: bool = False) -> dict:
    """Return a normalized quote, using the SQL cache within the TTL."""
    row = await db.get(QuoteCache, symbol)
    if row is not None and not force:
        updated = row.updated_at
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=UTC)
        if datetime.now(UTC) - updated < CACHE_TTL:
            return row.payload

    data = await yahoo.fetch_chart(symbol)
    quote = yahoo.normalize_quote(symbol, data)

    if row is not None:
        row.payload = quote
        row.updated_at = datetime.now(UTC)
    else:
        db.add(QuoteCache(symbol=symbol, payload=quote))
    await db.commit()
    return quote
