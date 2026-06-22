import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.indicators.bias import composite_bias
from app.indicators.technical import atr, pivot_points
from app.services import fred, news, sentiment, yahoo
from app.services.cache import get_cached
from app.services.market import get_quote

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


_EMPTY_SENTIMENT = {"positive": 0, "negative": 0, "neutral": 0}


@router.get("/news")
async def news_feed(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, "news:gold", 600, lambda: news.fetch_feed(news.GOLD_FEEDS[0]))
        articles = news.normalize_news(raw)
        counts = dict(_EMPTY_SENTIMENT)
        for article in articles:
            counts[article["sentiment"]] += 1
        return {"articles": articles, "sentiment": counts}
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"articles": [], "sentiment": dict(_EMPTY_SENTIMENT), "error": "unavailable"}


@router.get("/real-yield")
async def real_yield(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        text = await get_cached(db, "fred:DFII10", 3600, lambda: fred.fetch_series("DFII10"))
        series = fred.parse_series(text)
        if not series:
            return {"error": "unavailable"}
        latest = series[-1]
        prev = series[-2] if len(series) > 1 else None
        if prev is None or latest["value"] == prev["value"]:
            trend = "flat"
        else:
            trend = "up" if latest["value"] > prev["value"] else "down"
        return {
            "value": latest["value"],
            "date": latest["date"],
            "trend": trend,
            "history": [s["value"] for s in series[-35:]],
        }
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"error": "unavailable"}


@router.get("/macro-regime")
async def macro_regime(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        vix_quote = await get_quote(db, "^VIX")
        vix = vix_quote.get("price")
        text = await get_cached(db, "fred:DFII10", 3600, lambda: fred.fetch_series("DFII10"))
        series = fred.parse_series(text)
        real = series[-1]["value"] if series else None
        if vix is None:
            regime = "UNKNOWN"
        elif vix < 15:
            regime = "RISK-ON"
        elif vix < 25:
            regime = "NEUTRAL"
        else:
            regime = "RISK-OFF"
        return {"regime": regime, "vix": vix, "realYield": real}
    except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
        return {"error": "unavailable"}
