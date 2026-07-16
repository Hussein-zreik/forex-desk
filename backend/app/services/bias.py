"""The 6-signal composite bias, shared by the API route and the snapshot job.

Extracted from the widgets router so the poller can compute snapshots without
importing a router. Behavior is unchanged: every signal is best-effort — one
upstream failure reads neutral instead of sinking the whole composite.
"""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.indicators.bias import composite_bias
from app.services import fred, news, yahoo
from app.services.cache import get_cached
from app.services.market import get_quote

_ERRORS = (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError)

_USD_PAIRS = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "AUDUSD=X", "USDCAD=X"]

# Symbols the composite is meaningful for (snapshot job iterates these).
SNAPSHOT_SYMBOLS = ["XAU=F", "EURUSD=X", "GBPUSD=X", "USDJPY=X", "DX-Y.NYB"]


def _dir(score: float) -> str:
    return "bull" if score > 20 else "bear" if score < -20 else "neutral"


async def compute_composite(db: AsyncSession, symbol: str) -> dict:
    """Aggregate six macro/technical signals into one directional read.

    Each signal scores positive = bullish for the symbol; inverted where a
    rising value hurts it (dollar, real yields — calibrated for gold, the
    default desk symbol).
    """
    signals: list[dict] = []

    def add(label: str, score: float) -> None:
        signals.append({"label": label, "dir": _dir(score)})

    # 1. Macro regime — risk-off (high VIX) is bullish for gold.
    try:
        vix = (await get_quote(db, "^VIX")).get("price")
        add("Macro Regime", 60 if vix and vix >= 25 else -60 if vix and vix < 15 else 0)
    except _ERRORS:
        add("Macro Regime", 0)

    # 2. DXY trend — a rising dollar is bearish for gold (inverted).
    try:
        raw = await get_cached(db, "ohlc:DX-Y.NYB:1d", 300, lambda: yahoo.fetch_ohlc("DX-Y.NYB"))
        add("DXY Trend", -composite_bias(yahoo.extract_closes(raw))["score"])
    except _ERRORS:
        add("DXY Trend", 0)

    # 3. MTF confluence on the symbol itself.
    try:
        raw = await get_cached(db, f"ohlc:{symbol}:1d", 300, lambda: yahoo.fetch_ohlc(symbol))
        add("MTF Confluence", composite_bias(yahoo.extract_closes(raw))["score"])
    except _ERRORS:
        add("MTF Confluence", 0)

    # 4. Currency strength (USD) — a strong dollar is bearish for gold (inverted).
    try:
        usd = 0.0
        for pair in _USD_PAIRS:
            cp = (await get_quote(db, pair)).get("changePercent")
            if cp is not None:
                usd += cp if pair.startswith("USD") else -cp
        add("Currency Strength", -usd * 20)
    except _ERRORS:
        add("Currency Strength", 0)

    # 5. News sentiment — net positive gold headlines are bullish.
    try:
        datasets = [
            await get_cached(db, f"news:{u}", 600, lambda u=u: news.fetch_feed(u))
            for u in news.GOLD_FEEDS[:3]
        ]
        net = sum(
            1 if a["sentiment"] == "positive" else -1 if a["sentiment"] == "negative" else 0
            for a in news.aggregate(datasets)
        )
        add("News Sentiment", net * 25)
    except _ERRORS:
        add("News Sentiment", 0)

    # 6. Real yield — rising real yields are bearish for gold (inverted).
    try:
        series = fred.parse_series(
            await get_cached(db, "fred:DFII10", 3600, lambda: fred.fetch_series("DFII10"))
        )
        chg = series[-1]["value"] - series[-2]["value"] if len(series) >= 2 else 0
        add("Real Yield", -60 if chg > 0 else 60 if chg < 0 else 0)
    except _ERRORS:
        add("Real Yield", 0)

    bullish = sum(1 for s in signals if s["dir"] == "bull")
    bearish = sum(1 for s in signals if s["dir"] == "bear")
    score = round((bullish - bearish) / len(signals) * 100) if signals else 0
    label = "BULLISH" if score > 20 else "BEARISH" if score < -20 else "NEUTRAL"
    return {
        "symbol": symbol,
        "signals": signals,
        "score": score,
        "label": label,
        "bullish": bullish,
        "bearish": bearish,
    }
