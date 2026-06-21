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


def _ohlc(n: int) -> dict:
    return {
        "chart": {
            "result": [
                {
                    "indicators": {
                        "quote": [
                            {
                                "open": [100.0 + i for i in range(n)],
                                "high": [101.0 + i for i in range(n)],
                                "low": [99.0 + i for i in range(n)],
                                "close": [100.0 + i for i in range(n)],
                            }
                        ]
                    }
                }
            ]
        }
    }


def test_pivots(client, monkeypatch):
    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return _ohlc(5)

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    res = client.get("/api/indicators/pivots", params={"symbol": "EURUSD=X"})
    body = res.json()
    assert body["symbol"] == "EURUSD=X"
    # last candle: h=105, l=103, c=104 → pp = 312/3 = 104
    assert round(body["levels"]["pp"], 2) == 104.0
    assert body["levels"]["r1"] > body["levels"]["pp"] > body["levels"]["s1"]


def test_volatility(client, monkeypatch):
    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return _ohlc(30)

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    res = client.get("/api/indicators/volatility", params={"symbol": "GBPUSD=X"})
    body = res.json()
    assert body["symbol"] == "GBPUSD=X"
    assert body["atr"] is not None
    assert body["upper"] > body["price"] > body["lower"]
