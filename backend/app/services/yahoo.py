import re

import httpx

CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}

# Tickers only ever use these characters (e.g. XAU=F, DX-Y.NYB, ^GSPC, BTC-USD).
# Reject anything else so user-supplied symbols can't shape the outbound request
# or pollute the cache with arbitrary keys.
_SYMBOL_RE = re.compile(r"^[A-Za-z0-9.=^-]{1,15}$")


def validate_symbol(symbol: str) -> str:
    if not _SYMBOL_RE.match(symbol):
        raise ValueError(f"invalid symbol: {symbol!r}")
    return symbol


async def fetch_chart(symbol: str) -> dict:
    """Fetch the raw Yahoo Finance chart payload for a symbol."""
    validate_symbol(symbol)
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(CHART_URL.format(symbol=symbol))
        resp.raise_for_status()
        return resp.json()


async def fetch_ohlc(symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
    """Fetch a historical OHLC series for a symbol."""
    validate_symbol(symbol)
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(
            CHART_URL.format(symbol=symbol),
            params={"interval": interval, "range": range_},
        )
        resp.raise_for_status()
        return resp.json()


def normalize_quote(symbol: str, data: dict) -> dict:
    """Reduce a Yahoo chart payload to a compact quote."""
    meta = data["chart"]["result"][0]["meta"]
    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")

    change = price - prev if price is not None and prev else None
    change_pct = (change / prev * 100) if change is not None and prev else None

    return {
        "symbol": symbol,
        "price": price,
        "previousClose": prev,
        "change": change,
        "changePercent": change_pct,
        "currency": meta.get("currency"),
        "marketTime": meta.get("regularMarketTime"),
        # Intraday range (present in the chart meta) — powers the quote card's
        # High/Low rows and the range-aware signal.
        "dayHigh": meta.get("regularMarketDayHigh"),
        "dayLow": meta.get("regularMarketDayLow"),
    }


def extract_closes(data: dict) -> list[float]:
    """Extract the non-null close series from an OHLC payload."""
    result = data["chart"]["result"][0]
    closes = result["indicators"]["quote"][0]["close"]
    return [c for c in closes if c is not None]


def extract_candles(data: dict) -> list[dict]:
    """Extract non-null OHLC candles from a chart payload."""
    quote = data["chart"]["result"][0]["indicators"]["quote"][0]
    opens = quote.get("open") or []
    highs = quote.get("high") or []
    lows = quote.get("low") or []
    closes = quote.get("close") or []
    candles: list[dict] = []
    for o, h, low, c in zip(opens, highs, lows, closes, strict=False):
        if None in (o, h, low, c):
            continue
        candles.append({"o": o, "h": h, "l": low, "c": c})
    return candles


def extract_volumes(data: dict) -> list[float]:
    """Extract the non-null volume series from an OHLC payload."""
    quote = data["chart"]["result"][0]["indicators"]["quote"][0]
    volumes = quote.get("volume") or []
    return [v for v in volumes if v is not None]
