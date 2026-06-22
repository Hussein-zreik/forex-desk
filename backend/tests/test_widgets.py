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


def test_news_classifies_sentiment(client, monkeypatch):
    feed = {
        "feed": {"title": "Kitco"},
        "items": [
            {"title": "Gold rallies to record high", "link": "http://x/1", "pubDate": "d"},
            {"title": "Gold falls on dollar strength", "link": "http://x/2", "pubDate": "d"},
        ],
    }

    async def fake_feed(url):
        return feed

    monkeypatch.setattr("app.services.news.fetch_feed", fake_feed)
    body = client.get("/api/news").json()
    assert len(body["articles"]) == 2
    assert body["articles"][0]["sentiment"] == "positive"
    assert body["sentiment"]["positive"] >= 1


def test_real_yield(client, monkeypatch):
    csv_text = "DATE,DFII10\n2026-06-19,2.10\n2026-06-20,2.15\n2026-06-21,2.18\n"

    async def fake_series(series_id):
        return csv_text

    monkeypatch.setattr("app.services.fred.fetch_series", fake_series)
    body = client.get("/api/real-yield").json()
    assert body["value"] == 2.18
    assert body["trend"] == "up"
    assert len(body["history"]) == 3


def test_mtf_all_bullish(client, monkeypatch):
    closes = [float(x) for x in range(100, 160)]
    ohlc = {"chart": {"result": [{"indicators": {"quote": [{"close": closes}]}}]}}

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/indicators/mtf", params={"symbol": "XAU=F"}).json()
    assert body["overall"] == "BULLISH"
    assert len(body["timeframes"]) == 3
    assert all(t["label"] == "BULLISH" for t in body["timeframes"])


def test_hilo_breakout_up(client, monkeypatch):
    ohlc = {
        "chart": {
            "result": [
                {
                    "indicators": {
                        "quote": [
                            {
                                "open": [100.0] * 20 + [150.0],
                                "high": [101.0] * 20 + [201.0],
                                "low": [99.0] * 20 + [150.0],
                                "close": [100.0] * 20 + [200.0],
                            }
                        ]
                    }
                }
            ]
        }
    }

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/indicators/hilo", params={"symbol": "GBPUSD=X", "days": 20}).json()
    assert body["status"] == "breakout-up"
    assert body["price"] == 200.0


def test_key_levels(client, monkeypatch):
    n = 15
    highs = [100.0 + (10 if i == 7 else 0) for i in range(n)]
    lows = [90.0 - (10 if i == 3 else 0) for i in range(n)]
    closes = [95.0] * n
    ohlc = {
        "chart": {
            "result": [
                {
                    "indicators": {
                        "quote": [{"open": closes, "high": highs, "low": lows, "close": closes}]
                    }
                }
            ]
        }
    }

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/indicators/key-levels", params={"symbol": "EURUSD=X"}).json()
    assert body["price"] == 95.0
    assert 110.0 in body["resistance"]
    assert 80.0 in body["support"]


def test_smc_bos_up(client, monkeypatch):
    ohlc = {
        "chart": {
            "result": [
                {
                    "indicators": {
                        "quote": [
                            {
                                "open": [100.0] * 10,
                                "high": [101.0] * 9 + [121.0],
                                "low": [99.0] * 9 + [119.0],
                                "close": [100.0] * 9 + [120.0],
                            }
                        ]
                    }
                }
            ]
        }
    }

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/indicators/smc", params={"symbol": "XAU=F"}).json()
    assert body["structure"] == "BOS ↑"
    assert body["price"] == 120.0


def test_correlation_matrix(client, monkeypatch):
    rising = {
        "chart": {
            "result": [{"indicators": {"quote": [{"close": [float(i) for i in range(1, 20)]}]}}]
        }
    }
    falling = {
        "chart": {
            "result": [{"indicators": {"quote": [{"close": [float(i) for i in range(20, 1, -1)]}]}}]
        }
    }

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return rising if symbol == "AAA" else falling

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/correlation", params={"symbols": "AAA,BBB"}).json()
    assert body["symbols"] == ["AAA", "BBB"]
    assert body["matrix"][0][0] == 1.0
    assert -1.0 <= body["matrix"][0][1] <= 1.0


def test_etf_flow(client, monkeypatch):
    vols = [1000.0] * 20 + [2000.0]
    ohlc = {
        "chart": {
            "result": [
                {
                    "indicators": {
                        "quote": [
                            {
                                "open": [1.0] * 21,
                                "high": [1.0] * 21,
                                "low": [1.0] * 21,
                                "close": [1.0] * 21,
                                "volume": vols,
                            }
                        ]
                    }
                }
            ]
        }
    }

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return ohlc

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    body = client.get("/api/etf-flow").json()
    assert body["etfs"]["GLD"]["ratio"] == 2.0
    assert body["etfs"]["IAU"]["volume"] == 2000.0


def test_macro_regime_risk_on(client, monkeypatch):
    vix_chart = {
        "chart": {"result": [{"meta": {"regularMarketPrice": 12.5, "chartPreviousClose": 13.0}}]}
    }

    async def fake_chart(symbol):
        return vix_chart

    async def fake_series(series_id):
        return "DATE,DFII10\n2026-06-21,2.10\n"

    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_chart)
    monkeypatch.setattr("app.services.fred.fetch_series", fake_series)
    body = client.get("/api/macro-regime").json()
    assert body["vix"] == 12.5
    assert body["regime"] == "RISK-ON"
    assert body["realYield"] == 2.10
