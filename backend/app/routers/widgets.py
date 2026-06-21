import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.indicators.bias import composite_bias
from app.services import sentiment, yahoo
from app.services.cache import get_cached

router = APIRouter(prefix="/api", tags=["widgets"])


@router.get("/fear-greed")
async def fear_greed(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, "fear_greed", 600, sentiment.fetch_fear_greed)
        return sentiment.normalize_fear_greed(raw)
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"latest": None, "history": [], "error": "unavailable"}


@router.get("/indicators/bias")
async def bias(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        result = composite_bias(yahoo.extract_closes(raw))
        result["symbol"] = symbol
        return result
    except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
        return {"symbol": symbol, "error": "unavailable"}
