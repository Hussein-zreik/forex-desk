CHART = {
    "chart": {
        "result": [
            {
                "meta": {
                    "regularMarketPrice": 1.1,
                    "chartPreviousClose": 1.0,
                    "currency": "USD",
                    "regularMarketTime": 1718000000,
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
