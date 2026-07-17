"""Default provider: the existing Yahoo Finance service, unchanged."""

from app.services import yahoo


class YahooProvider:
    name = "yahoo"

    async def fetch_chart(self, symbol: str) -> dict:
        return await yahoo.fetch_chart(symbol)

    async def fetch_quote_detail(self, symbol: str) -> dict:
        return await yahoo.fetch_quote_detail(symbol)

    async def fetch_ohlc(self, symbol: str, interval: str = "1d", range_: str = "6mo") -> dict:
        return await yahoo.fetch_ohlc(symbol, interval, range_)
