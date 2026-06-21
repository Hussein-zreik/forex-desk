import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.market import get_quote

router = APIRouter(prefix="/api/quotes", tags=["market"])


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
        except (httpx.HTTPError, KeyError, IndexError):
            results.append({"symbol": symbol, "error": "unavailable"})
    return {"quotes": results}
