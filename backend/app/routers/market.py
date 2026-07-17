import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services import providers, yahoo
from app.services.cache import get_cached
from app.services.market import get_quote

router = APIRouter(prefix="/api/quotes", tags=["market"])

_QUOTE_ERRORS = (httpx.HTTPError, KeyError, IndexError, ValueError)


@router.get("")
async def quotes(
    symbols: str = Query(..., description="Comma-separated symbols, e.g. EURUSD=X,GC=F"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    requested = [s.strip() for s in symbols.split(",") if s.strip()]
    results = []
    for symbol in requested:
        try:
            results.append(await get_quote(db, symbol))
        except _QUOTE_ERRORS:
            results.append({"symbol": symbol, "error": "unavailable"})

    # Single-symbol requests (the hero quote cards) get realtime bid/ask/open from
    # the v7 quote endpoint; batch requests (ticker, currency strength, crypto) skip
    # it so we don't fire N extra calls. Best-effort — failures leave the base quote.
    if len(requested) == 1 and "error" not in results[0]:
        try:
            raw = await get_cached(
                db,
                f"qdetail:{requested[0]}",
                15,
                lambda: providers.fetch_quote_detail(requested[0]),
            )
            results[0] = {**results[0], **yahoo.normalize_quote_detail(raw)}
        except _QUOTE_ERRORS:
            pass

    return {"quotes": results}
