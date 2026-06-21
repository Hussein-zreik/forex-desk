FNG = {
    "data": [
        {"value": "55", "timestamp": "1718000000", "value_classification": "Greed"},
        {"value": "40", "timestamp": "1717900000", "value_classification": "Fear"},
    ]
}


def test_fear_greed_normalizes(client, monkeypatch):
    async def fake_fetch():
        return FNG

    monkeypatch.setattr("app.services.sentiment.fetch_fear_greed", fake_fetch)

    res = client.get("/api/fear-greed")
    assert res.status_code == 200
    body = res.json()
    assert body["latest"]["value"] == 55
    assert body["latest"]["classification"] == "Greed"
    assert len(body["history"]) == 2
    # history is chronological (oldest first)
    assert body["history"][0]["value"] == 40


def test_bias_bullish_on_rising_series(client, monkeypatch):
    closes = [float(x) for x in range(100, 160)]  # steadily rising
    ohlc = {"chart": {"result": [{"indicators": {"quote": [{"close": closes}]}}]}}

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)

    res = client.get("/api/indicators/bias", params={"symbol": "XAU=F"})
    assert res.status_code == 200
    body = res.json()
    assert body["symbol"] == "XAU=F"
    assert body["label"] == "BULLISH"
    assert body["score"] > 20


def test_bias_handles_failure(client, monkeypatch):
    async def boom(symbol, interval="1d", range_="6mo"):
        raise KeyError("bad")

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", boom)

    res = client.get("/api/indicators/bias", params={"symbol": "ZZZ"})
    assert res.status_code == 200
    assert res.json()["error"] == "unavailable"
