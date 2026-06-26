import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.indicators.bias import composite_bias
from app.indicators.smc import smc
from app.indicators.technical import atr, key_levels, pearson, pivot_points, returns
from app.services import calendar as cal_svc
from app.services import cboe, cot, fred, news, sentiment, yahoo
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


_MTF_INTERVALS = [("1d", "6mo", "D1"), ("1h", "1mo", "H1"), ("15m", "5d", "M15")]


@router.get("/indicators/mtf")
async def mtf(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    rows = []
    for interval, rng, label in _MTF_INTERVALS:
        try:
            raw = await get_cached(
                db,
                f"ohlc:{symbol}:{interval}",
                300,
                lambda i=interval, r=rng: yahoo.fetch_ohlc(symbol, i, r),
            )
            result = composite_bias(yahoo.extract_closes(raw))
            rows.append({"tf": label, "label": result["label"], "score": result["score"]})
        except _OHLC_ERRORS:
            rows.append({"tf": label, "label": "N/A", "score": 0})

    valid = [r for r in rows if r["label"] != "N/A"]
    avg = sum(r["score"] for r in valid) / len(valid) if valid else 0
    overall = "BULLISH" if avg > 20 else "BEARISH" if avg < -20 else "NEUTRAL" if valid else "N/A"
    return {"symbol": symbol, "timeframes": rows, "overall": overall, "score": round(avg, 1)}


@router.get("/indicators/hilo")
async def hilo(
    symbol: str = Query(...),
    days: int = 20,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        candles = yahoo.extract_candles(raw)
        if len(candles) < days + 1:
            return {"symbol": symbol, "error": "unavailable"}
        window = candles[-(days + 1) : -1]
        high = max(c["h"] for c in window)
        low = min(c["l"] for c in window)
        price = candles[-1]["c"]
        status = "breakout-up" if price > high else "breakout-down" if price < low else "in-range"
        return {
            "symbol": symbol,
            "days": days,
            "high": high,
            "low": low,
            "price": price,
            "status": status,
        }
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/indicators/key-levels")
async def key_levels_endpoint(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        candles = yahoo.extract_candles(raw)
        if not candles:
            return {"symbol": symbol, "error": "unavailable"}
        price = candles[-1]["c"]
        return {"symbol": symbol, "price": price, **key_levels(candles, price)}
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/indicators/smc")
async def smc_endpoint(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        result = smc(yahoo.extract_candles(raw))
        if not result:
            return {"symbol": symbol, "error": "unavailable"}
        return {"symbol": symbol, **result}
    except _OHLC_ERRORS:
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/correlation")
async def correlation(symbols: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    syms = [s.strip() for s in symbols.split(",") if s.strip()][:6]
    series: dict[str, list[float]] = {}
    for s in syms:
        try:
            raw = await get_cached(db, f"ohlc:{s}:1d", 300, lambda x=s: yahoo.fetch_ohlc(x))
            series[s] = returns(yahoo.extract_closes(raw))
        except _OHLC_ERRORS:
            series[s] = []

    matrix = []
    for a in syms:
        row = []
        for b in syms:
            if a == b:
                row.append(1.0)
            elif series[a] and series[b]:
                c = pearson(series[a], series[b])
                row.append(round(c, 2) if c is not None else None)
            else:
                row.append(None)
        matrix.append(row)
    return {"symbols": syms, "matrix": matrix}


@router.get("/calendar")
async def calendar(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        raw = await get_cached(db, "calendar:thisweek", 3600, cal_svc.fetch_calendar)
        return {"events": cal_svc.normalize_calendar(raw)}
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"events": [], "error": "unavailable"}


@router.get("/options-sentiment")
async def options_sentiment(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        text = await get_cached(db, "cboe:putcall", 3600, cboe.fetch_putcall)
        series = cboe.parse_putcall(text)
        if not series:
            return {"error": "unavailable"}
        latest = series[-1]
        ratio = latest["ratio"]
        return {
            "ratio": ratio,
            "date": latest["date"],
            "sentiment": cboe.classify(ratio),
            "history": [s["ratio"] for s in series[-35:]],
        }
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"error": "unavailable"}


@router.get("/cot")
async def cot_positioning(symbol: str = Query(...), db: AsyncSession = Depends(get_db)) -> dict:
    market = cot.SYMBOL_MARKETS.get(symbol)
    if market is None:
        return {"symbol": symbol, "error": "unavailable"}
    try:
        rows = await get_cached(db, f"cot:{symbol}", 21_600, lambda: cot.fetch_cot(market))
        result = cot.parse_cot(rows)
        if result is None:
            return {"symbol": symbol, "error": "unavailable"}
        return {"symbol": symbol, **result}
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {"symbol": symbol, "error": "unavailable"}


@router.get("/etf-flow")
async def etf_flow(db: AsyncSession = Depends(get_db)) -> dict:
    out: dict[str, dict | None] = {}
    for sym in ("GLD", "IAU"):
        try:
            raw = await get_cached(db, f"ohlc:{sym}:1d", 300, lambda s=sym: yahoo.fetch_ohlc(s))
            volumes = yahoo.extract_volumes(raw)
            if len(volumes) < 21:
                out[sym] = None
                continue
            last = volumes[-1]
            avg20 = sum(volumes[-21:-1]) / 20
            out[sym] = {
                "volume": last,
                "avg20": round(avg20),
                "ratio": round(last / avg20, 2) if avg20 else None,
            }
        except _OHLC_ERRORS:
            out[sym] = None
    return {"etfs": out}
