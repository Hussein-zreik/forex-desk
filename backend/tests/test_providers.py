"""Provider abstraction: symbol mapping, shape conversion, selection, fallback."""

import asyncio

import pytest

from app.services import providers, yahoo
from app.services.providers import twelvedata
from app.services.providers.base import UnsupportedSymbol

TD_QUOTE = {
    "symbol": "XAU/USD",
    "close": "4018.90",
    "previous_close": "3997.20",
    "open": "4001.30",
    "high": "4031.20",
    "low": "3998.40",
    "currency": "USD",
    "timestamp": 1780000000,
}

TD_SERIES = {
    "meta": {"symbol": "XAU/USD", "currency": "USD"},
    "status": "ok",
    "values": [  # newest first, as Twelve Data returns them
        {"datetime": "2026-07-03", "open": "4010", "high": "4040", "low": "4000", "close": "4030"},
        {"datetime": "2026-07-02", "open": "3990", "high": "4020", "low": "3980", "close": "4010"},
        {"datetime": "2026-07-01", "open": "3970", "high": "4000", "low": "3960", "close": "3990"},
    ],
}


def test_symbol_mapping():
    assert twelvedata.map_symbol("XAU=F") == "XAU/USD"
    assert twelvedata.map_symbol("GC=F") == "XAU/USD"
    assert twelvedata.map_symbol("EURUSD=X") == "EUR/USD"
    assert twelvedata.map_symbol("BTC-USD") == "BTC/USD"
    with pytest.raises(UnsupportedSymbol):
        twelvedata.map_symbol("^GSPC")  # no free mapping — falls back to yahoo


def test_quote_conversion_satisfies_yahoo_normalizer():
    """The converted payload must run through the existing yahoo normalizer."""
    chart = twelvedata.chart_from_quote("XAU=F", TD_QUOTE)
    quote = yahoo.normalize_quote("XAU=F", chart)
    assert quote["price"] == 4018.90
    assert quote["previousClose"] == 3997.20
    assert round(quote["changePercent"], 2) == 0.54
    assert quote["dayHigh"] == 4031.20
    assert quote["currency"] == "USD"


def test_series_conversion_satisfies_yahoo_extractors():
    chart = twelvedata.chart_from_series("XAU=F", TD_SERIES)
    closes = yahoo.extract_closes(chart)
    assert closes == [3990.0, 4010.0, 4030.0]  # oldest → newest
    candles = yahoo.extract_candles(chart)
    assert candles[0] == {"o": 3970.0, "h": 4000.0, "l": 3960.0, "c": 3990.0}
    quote = yahoo.normalize_quote("XAU=F", chart)
    assert quote["price"] == 4030.0 and quote["previousClose"] == 4010.0


def test_default_provider_is_yahoo():
    assert providers.get_provider().name == "yahoo"


def test_unknown_provider_falls_back_to_yahoo(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "market_provider", "bloomberg")
    assert providers.get_provider().name == "yahoo"


def test_dispatch_falls_back_per_symbol(monkeypatch):
    """twelvedata selected: mapped symbols use it, unmapped fall to yahoo."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "market_provider", "twelvedata")
    calls: list[str] = []

    async def fake_td_get(path, params):
        calls.append(f"td:{params['symbol']}")
        return TD_QUOTE

    async def fake_yahoo_chart(symbol):
        calls.append(f"yahoo:{symbol}")
        return {"chart": {"result": [{"meta": {"regularMarketPrice": 1.0}}]}}

    monkeypatch.setattr(settings, "twelvedata_api_key", "test-key")
    monkeypatch.setattr("app.services.providers.twelvedata._get", fake_td_get)
    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_yahoo_chart)

    async def run():
        gold = await providers.fetch_chart("XAU=F")  # mapped → twelvedata
        spx = await providers.fetch_chart("^GSPC")  # unmapped → yahoo fallback
        return gold, spx

    gold, spx = asyncio.run(run())
    assert calls == ["td:XAU/USD", "yahoo:^GSPC"]
    assert yahoo.normalize_quote("XAU=F", gold)["price"] == 4018.90
    assert spx["chart"]["result"][0]["meta"]["regularMarketPrice"] == 1.0


def test_dispatch_falls_back_on_provider_error(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "market_provider", "twelvedata")
    monkeypatch.setattr(settings, "twelvedata_api_key", "test-key")

    async def boom(path, params):
        raise ValueError("twelvedata: rate limited")

    async def fake_yahoo_chart(symbol):
        return {"chart": {"result": [{"meta": {"regularMarketPrice": 2.0}}]}}

    monkeypatch.setattr("app.services.providers.twelvedata._get", boom)
    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_yahoo_chart)

    chart = asyncio.run(providers.fetch_chart("EURUSD=X"))
    assert chart["chart"]["result"][0]["meta"]["regularMarketPrice"] == 2.0


def test_quotes_route_still_works_through_dispatcher(client, monkeypatch):
    """End-to-end: the /api/quotes route flows through the provider layer."""

    async def fake_yahoo_chart(symbol):
        return {
            "chart": {
                "result": [{"meta": {"regularMarketPrice": 1.23, "chartPreviousClose": 1.2}}]
            }
        }

    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_yahoo_chart)
    body = client.get("/api/quotes", params={"symbols": "EURUSD=X"}).json()
    assert body["quotes"][0]["price"] == 1.23
