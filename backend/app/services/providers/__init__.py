"""Provider selection + dispatch with per-symbol Yahoo fallback.

`settings.market_provider` picks the source ("yahoo" default, "twelvedata").
Every call falls back to Yahoo when the selected provider can't serve a
symbol or errors, so flipping the env var can never lose a widget.
"""

import logging

from app.core.config import settings
from app.services.providers.base import MarketDataProvider, UnsupportedSymbol
from app.services.providers.resilience import CircuitBreaker, retry_async
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

# One breaker per provider, keyed by name, so a sustained upstream outage stops
# being retried every poll cycle and short-circuits straight to the fallback.
_BREAKERS: dict[str, CircuitBreaker] = {}


def _breaker(name: str) -> CircuitBreaker:
    breaker = _BREAKERS.get(name)
    if breaker is None:
        breaker = _BREAKERS[name] = CircuitBreaker(name)
    return breaker


def reset_breakers() -> None:
    """Clear all breaker state (used by tests)."""
    _BREAKERS.clear()


def get_provider() -> MarketDataProvider:
    provider = _PROVIDERS.get(settings.market_provider)
    if provider is None:
        logger.warning("unknown MARKET_PROVIDER %r — using yahoo", settings.market_provider)
        return _YAHOO
    return provider


async def _dispatch(method: str, symbol: str, *args) -> dict:
    provider = get_provider()
    if provider is not _YAHOO:
        breaker = _breaker(provider.name)
        if breaker.allow():
            try:
                result = await retry_async(
                    lambda: getattr(provider, method)(symbol, *args),
                    do_not_retry=(UnsupportedSymbol,),
                )
                breaker.record_success()
                return result
            except UnsupportedSymbol:
                # A per-symbol gap, not an outage — don't hold it against the
                # provider's health; just fall back for this symbol.
                logger.debug(
                    "%s: %s unsupported for %s — yahoo fallback", provider.name, method, symbol
                )
            except Exception:
                breaker.record_failure()
                logger.warning(
                    "%s: %s failed for %s — yahoo fallback", provider.name, method, symbol
                )
        else:
            logger.debug(
                "%s circuit open — %s for %s going straight to yahoo",
                provider.name,
                method,
                symbol,
            )
    # Yahoo (the fallback / last resort) still gets retry for transient blips;
    # if it too fails, the caller's cache layer serves the last known value.
    return await retry_async(lambda: getattr(_YAHOO, method)(symbol, *args))


async def fetch_chart(symbol: str) -> dict:
    return await _dispatch("fetch_chart", symbol)


async def fetch_quote_detail(symbol: str) -> dict:
    return await _dispatch("fetch_quote_detail", symbol)


async def fetch_ohlc(symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
    return await _dispatch("fetch_ohlc", symbol, interval, range_)
