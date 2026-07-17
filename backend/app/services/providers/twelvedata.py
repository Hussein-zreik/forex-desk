"""Twelve Data adapter — licensed quotes/OHLC converted to the Yahoo shapes.

Free tier: 8 requests/minute, 800/day — viable because every fetch sits
behind the app's SQL cache TTLs. Symbols the desk uses but Twelve Data can't
serve raise UnsupportedSymbol so the dispatcher falls back to Yahoo per
symbol.
"""

import re

import httpx

from app.core.config import settings
from app.services.providers.base import UnsupportedSymbol

BASE_URL = "https://api.twelvedata.com"

# Desk symbol → Twelve Data symbol. Metals futures map to the spot pair the
# provider actually licenses; indices/energy stay on Yahoo (no free mapping).
_SYMBOL_MAP = {
    "XAU=F": "XAU/USD",
    "GC=F": "XAU/USD",
    "XAG=F": "XAG/USD",
    "SI=F": "XAG/USD",
    "BTC-USD": "BTC/USD",
}

_FX_RE = re.compile(r"^([A-Z]{3})([A-Z]{3})=X$")

_INTERVALS = {"1d": "1day", "1h": "1h", "1wk": "1week", "15m": "15min", "5m": "5min"}
_RANGE_BARS = {"5d": 5, "1mo": 22, "3mo": 66, "6mo": 130, "1y": 260, "2y": 520}


def map_symbol(symbol: str) -> str:
    if symbol in _SYMBOL_MAP:
        return _SYMBOL_MAP[symbol]
    fx = _FX_RE.match(symbol)
    if fx:
        return f"{fx.group(1)}/{fx.group(2)}"
    raise UnsupportedSymbol(symbol)


def _f(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def _get(path: str, params: dict) -> dict:
    if not settings.twelvedata_api_key:
        raise UnsupportedSymbol("twelvedata api key not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{BASE_URL}{path}", params={**params, "apikey": settings.twelvedata_api_key}
        )
        resp.raise_for_status()
        data = resp.json()
    if isinstance(data, dict) and data.get("status") == "error":
        raise ValueError(f"twelvedata: {data.get('message', 'error')}")
    return data


def chart_from_quote(symbol: str, q: dict) -> dict:
    """Convert a /quote payload into the Yahoo v8 chart shape."""
    return {
        "chart": {
            "result": [
                {
                    "meta": {
                        "regularMarketPrice": _f(q.get("close")),
                        "chartPreviousClose": _f(q.get("previous_close")),
                        "currency": q.get("currency"),
                        "regularMarketTime": q.get("timestamp"),
                        "regularMarketDayHigh": _f(q.get("high")),
                        "regularMarketDayLow": _f(q.get("low")),
                    }
                }
            ]
        }
    }


def chart_from_series(symbol: str, series: dict) -> dict:
    """Convert a /time_series payload (newest first) into the Yahoo shape."""
    values = list(reversed(series.get("values") or []))  # oldest → newest
    last = values[-1] if values else {}
    prev = values[-2] if len(values) > 1 else {}
    return {
        "chart": {
            "result": [
                {
                    "meta": {
                        "regularMarketPrice": _f(last.get("close")),
                        "chartPreviousClose": _f(prev.get("close")),
                        "currency": (series.get("meta") or {}).get("currency"),
                    },
                    "indicators": {
                        "quote": [
                            {
                                "open": [_f(v.get("open")) for v in values],
                                "high": [_f(v.get("high")) for v in values],
                                "low": [_f(v.get("low")) for v in values],
                                "close": [_f(v.get("close")) for v in values],
                                "volume": [_f(v.get("volume")) for v in values],
                            }
                        ]
                    },
                }
            ]
        }
    }


class TwelveDataProvider:
    name = "twelvedata"

    async def fetch_chart(self, symbol: str) -> dict:
        td_symbol = map_symbol(symbol)
        return chart_from_quote(symbol, await _get("/quote", {"symbol": td_symbol}))

    async def fetch_quote_detail(self, symbol: str) -> dict:
        td_symbol = map_symbol(symbol)
        q = await _get("/quote", {"symbol": td_symbol})
        open_ = _f(q.get("open"))
        result = {"regularMarketOpen": open_} if open_ is not None else {}
        return {"quoteResponse": {"result": [result]}}

    async def fetch_ohlc(self, symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
        td_symbol = map_symbol(symbol)
        series = await _get(
            "/time_series",
            {
                "symbol": td_symbol,
                "interval": _INTERVALS.get(interval, "1day"),
                "outputsize": _RANGE_BARS.get(range_, 130),
            },
        )
        return chart_from_series(symbol, series)
