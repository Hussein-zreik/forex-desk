CHART = {
    "chart": {
        "result": [
            {
                "meta": {
                    "regularMarketPrice": 1.1,
                    "chartPreviousClose": 1.0,
                    "currency": "USD",
                    "regularMarketTime": 1718000000,
                    "regularMarketDayHigh": 1.15,
                    "regularMarketDayLow": 1.05,
                }
            }
        ]
    }
}


def test_quotes_normalizes(client, monkeypatch):
    async def fake_fetch(symbol):
        return CHART

    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_fetch)

    res = client.get("/api/quotes", params={"symbols": "EURUSD=X"})
    assert res.status_code == 200
    quote = res.json()["quotes"][0]
    assert quote["symbol"] == "EURUSD=X"
    assert quote["price"] == 1.1
    assert round(quote["changePercent"], 2) == 10.0
    assert quote["dayHigh"] == 1.15
    assert quote["dayLow"] == 1.05


def test_quotes_uses_cache(client, monkeypatch):
    calls = {"n": 0}

    async def counting_fetch(symbol):
        calls["n"] += 1
        return CHART

    monkeypatch.setattr("app.services.yahoo.fetch_chart", counting_fetch)

    client.get("/api/quotes", params={"symbols": "GBPUSD=X"})
    client.get("/api/quotes", params={"symbols": "GBPUSD=X"})
    assert calls["n"] == 1  # second call served from cache


def test_quotes_handles_upstream_failure(client, monkeypatch):
    async def boom(symbol):
        raise KeyError("bad payload")

    monkeypatch.setattr("app.services.yahoo.fetch_chart", boom)

    res = client.get("/api/quotes", params={"symbols": "ZZZ=X"})
    assert res.status_code == 200
    assert res.json()["quotes"][0]["error"] == "unavailable"


def test_resolve_symbol_aliases_metals():
    from app.services import yahoo

    # Desk spot-metal symbols fetch from the reliable COMEX continuous futures…
    assert yahoo.resolve_symbol("XAU=F") == "GC=F"
    assert yahoo.resolve_symbol("XAG=F") == "SI=F"
    # …while everything else is fetched as-is.
    assert yahoo.resolve_symbol("EURUSD=X") == "EURUSD=X"
    assert yahoo.resolve_symbol("GC=F") == "GC=F"


def test_fetch_chart_requests_resolved_symbol(monkeypatch):
    import asyncio

    import httpx

    captured = {}

    class FakeResp:
        def raise_for_status(self):
            pass

        def json(self):
            return CHART

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            pass

        async def get(self, url, *a, **k):
            captured["url"] = url
            return FakeResp()

    from app.services import yahoo

    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    asyncio.run(yahoo.fetch_chart("XAU=F"))
    # The desk symbol XAU=F is fetched from Yahoo's canonical GC=F feed.
    assert "GC=F" in captured["url"]
    assert "XAU=F" not in captured["url"]
