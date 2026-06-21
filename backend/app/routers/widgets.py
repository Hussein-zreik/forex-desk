import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.indicators.bias import composite_bias
from app.indicators.technical import atr, pivot_points
from app.services import sentiment, yahoo
from app.services.cache import get_cached

_OHLC_ERRORS = (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError)

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
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/indicators/pivots")
async def pivots(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        candles = yahoo.extract_candles(raw)
        if not candles:
            return {"symbol": symbol, "error": "unavailable"}
        last = candles[-1]
        return {
            "symbol": symbol,
            "price": last["c"],
            "levels": pivot_points(last["h"], last["l"], last["c"]),
        }
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/indicators/volatility")
async def volatility(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        candles = yahoo.extract_candles(raw)
        value = atr(candles)
        if value is None:
            return {"symbol": symbol, "error": "unavailable"}
        price = candles[-1]["c"]
        return {
            "symbol": symbol,
            "atr": round(value, 4),
            "price": price,
            "upper": round(price + value, 4),
            "lower": round(price - value, 4),
        }
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}
