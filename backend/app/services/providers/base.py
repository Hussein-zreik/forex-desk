"""Market-data provider contract.

The whole app consumes market data through three fetches whose payloads are
then read by the yahoo-module normalizers/extractors (`normalize_quote`,
`extract_closes`, …). The provider contract is therefore *yahoo-shape
payloads*: any adapter converts its upstream response into the v8-chart /
v7-quote structures, and every router, indicator and cache key keeps working
unchanged regardless of the data source.
"""

from typing import Protocol


class UnsupportedSymbol(Exception):
    """The provider has no mapping for this symbol (dispatcher falls back)."""


class MarketDataProvider(Protocol):
    name: str

    async def fetch_chart(self, symbol: str) -> dict:
        """Current quote payload in Yahoo v8 chart shape (result[0].meta)."""
        ...

    async def fetch_quote_detail(self, symbol: str) -> dict:
        """Bid/ask/open payload in Yahoo v7 quote shape (best-effort)."""
        ...

    async def fetch_ohlc(self, symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
        """Historical series in Yahoo v8 chart shape (indicators.quote[0])."""
        ...
