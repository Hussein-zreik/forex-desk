"""Provider selection + dispatch with per-symbol Yahoo fallback.

`settings.market_provider` picks the source ("yahoo" default, "twelvedata").
Every call falls back to Yahoo when the selected provider can't serve a
symbol or errors, so flipping the env var can never lose a widget.
"""

import logging

from app.core.config import settings
from app.services.providers.base import MarketDataProvider, UnsupportedSymbol
from app.services.providers.twelvedata import TwelveDataProvider
from app.services.providers.yahoo_provider import YahooProvider

__all__ = [
    "MarketDataProvider",
    "UnsupportedSymbol",
    "fetch_chart",
    "fetch_ohlc",
    "fetch_quote_detail",
    "get_provider",
]

logger = logging.getLogger("app.providers")

_YAHOO = YahooProvider()
_PROVIDERS: dict[str, MarketDataProvider] = {
    "yahoo": _YAHOO,
    "twelvedata": TwelveDataProvider(),
}


def get_provider() -> MarketDataProvider:
    provider = _PROVIDERS.get(settings.market_provider)
    if provider is None:
        logger.warning("unknown MARKET_PROVIDER %r — using yahoo", settings.market_provider)
        return _YAHOO
    return provider


async def _dispatch(method: str, symbol: str, *args) -> dict:
    provider = get_provider()
    if provider is not _YAHOO:
        try:
            return await getattr(provider, method)(symbol, *args)
        except UnsupportedSymbol:
            logger.debug(
                "%s: %s unsupported for %s — yahoo fallback", provider.name, method, symbol
            )
        except Exception:
            logger.warning("%s: %s failed for %s — yahoo fallback", provider.name, method, symbol)
    return await getattr(_YAHOO, method)(symbol, *args)


async def fetch_chart(symbol: str) -> dict:
    return await _dispatch("fetch_chart", symbol)


async def fetch_quote_detail(symbol: str) -> dict:
    return await _dispatch("fetch_quote_detail", symbol)


async def fetch_ohlc(symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
    return await _dispatch("fetch_ohlc", symbol, interval, range_)
