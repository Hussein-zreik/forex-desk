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
    dfii = "DATE,DFII10\n2026-06-19,2.10\n2026-06-20,2.15\n2026-06-21,2.18\n"
    t10yie = "DATE,T10YIE\n2026-06-20,2.30\n2026-06-21,2.34\n"

    async def fake_series(series_id):
        return t10yie if series_id == "T10YIE" else dfii

    monkeypatch.setattr("app.services.fred.fetch_series", fake_series)
    body = client.get("/api/real-yield").json()
    assert body["value"] == 2.18
    assert body["trend"] == "up"
    assert body["breakeven"] == 2.34  # T10YIE breakeven inflation
    assert len(body["history"]) == 3


def test_composite_aggregates_six_signals(client, monkeypatch):
    closes = [float(x) for x in range(100, 160)]
    rising = {"chart": {"result": [{"indicators": {"quote": [{"close": closes}]}}]}}
    meta = {"regularMarketPrice": 30.0, "chartPreviousClose": 28.0}
    chart = {"chart": {"result": [{"meta": meta}]}}
    feed = {"feed": {"title": "Wire"}, "items": [{"title": "Gold rallies on demand", "link": "#"}]}

    async def fake_ohlc(symbol, interval="1d", range_="6mo"):
        return rising

    async def fake_chart(symbol):
        return chart

    async def fake_series(series_id):
        return "DATE,DFII10\n2026-06-20,2.10\n2026-06-21,2.20\n"

    async def fake_feed(url):
        return feed

    monkeypatch.setattr("app.services.yahoo.fetch_ohlc", fake_ohlc)
    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_chart)
    monkeypatch.setattr("app.services.fred.fetch_series", fake_series)
    monkeypatch.setattr("app.services.news.fetch_feed", fake_feed)

    body = client.get("/api/indicators/composite", params={"symbol": "XAU=F"}).json()
    assert len(body["signals"]) == 6
    assert {s["dir"] for s in body["signals"]} <= {"bull", "bear", "neutral"}
    assert body["label"] in {"BULLISH", "BEARISH", "NEUTRAL"}
    assert body["bullish"] + body["bearish"] <= 6
    labels = {s["label"] for s in body["signals"]}
    assert "Macro Regime" in labels and "Real Yield" in labels


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


def test_calendar(client, monkeypatch):
    sample = [
        {
            "title": "Non-Farm Employment Change",
            "country": "USD",
            "date": "2026-07-03T12:30:00-04:00",
            "impact": "High",
            "forecast": "180K",
            "previous": "200K",
        }
    ]

    async def fake_calendar():
        return sample

    monkeypatch.setattr("app.services.calendar.fetch_calendar", fake_calendar)
    body = client.get("/api/calendar").json()
    assert len(body["events"]) == 1
    assert body["events"][0]["currency"] == "USD"
    assert body["events"][0]["impact"] == "high"


def test_options_sentiment(client, monkeypatch):
    csv_text = (
        "DATE,CALLS,PUTS,Put/Call Ratio\n"
        "2026-06-19,1000,800,0.80\n"
        "2026-06-20,1000,1200,1.20\n"
    )

    async def fake_putcall():
        return csv_text

    monkeypatch.setattr("app.services.cboe.fetch_putcall", fake_putcall)
    body = client.get("/api/options-sentiment").json()
    assert body["ratio"] == 1.2
    assert body["sentiment"] == "Fear"
    assert body["history"] == [0.8, 1.2]


def test_options_sentiment_derives_ratio_from_columns(client, monkeypatch):
    # No explicit ratio column → derive puts/calls; low ratio ⇒ Greed.
    csv_text = "Date,Calls,Puts\n2026-06-20,2000,1000\n"

    async def fake_putcall():
        return csv_text

    monkeypatch.setattr("app.services.cboe.fetch_putcall", fake_putcall)
    body = client.get("/api/options-sentiment").json()
    assert body["ratio"] == 0.5
    assert body["sentiment"] == "Greed"


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


def test_cot_net_positioning(client, monkeypatch):
    rows = [
        {
            "report_date_as_yyyy_mm_dd": "2026-06-17T00:00:00.000",
            "noncomm_positions_long_all": "200000",
            "noncomm_positions_short_all": "120000",
        },
        {
            "report_date_as_yyyy_mm_dd": "2026-06-10T00:00:00.000",
            "noncomm_positions_long_all": "190000",
            "noncomm_positions_short_all": "125000",
        },
    ]

    async def fake_cot(market):
        return rows

    monkeypatch.setattr("app.services.cot.fetch_cot", fake_cot)
    body = client.get("/api/cot", params={"symbol": "XAU=F"}).json()
    assert body["symbol"] == "XAU=F"
    assert body["net"] == 80000  # 200k long - 120k short
    assert body["change"] == 15000  # 80000 - (190000-125000=65000)
    assert body["longPct"] == 62.5
    assert body["date"] == "2026-06-17"


def test_cot_unknown_symbol_is_unavailable(client):
    body = client.get("/api/cot", params={"symbol": "ZZZ"}).json()
    assert body["error"] == "unavailable"


def test_news_fx_aggregates_dedupes_and_tags(client, monkeypatch):
    feed_a = {
        "feed": {"title": "ForexLive"},
        "items": [
            {"title": "Dollar rises as Fed holds", "link": "a1"},
            {"title": "ECB keeps euro steady", "link": "a2"},
        ],
    }
    feed_b = {
        "feed": {"title": "FXStreet"},
        "items": [
            {"title": "Dollar rises as Fed holds", "link": "dup"},  # duplicate title
            {"title": "Gold climbs on demand", "link": "b1"},
        ],
    }
    calls = iter([feed_a, feed_b, feed_b])

    async def fake_fetch(url):
        return next(calls)

    monkeypatch.setattr("app.services.news.fetch_feed", fake_fetch)
    body = client.get("/api/news", params={"feed": "fx"}).json()
    titles = [a["title"] for a in body["articles"]]
    assert titles.count("Dollar rises as Fed holds") == 1  # deduped
    usd = next(a for a in body["articles"] if "Dollar" in a["title"])
    assert "USD" in usd["tags"]
    eur = next(a for a in body["articles"] if "ECB" in a["title"])
    assert "EUR" in eur["tags"]


def test_parse_feed_reads_rss_directly():
    from app.services import news

    rss = """<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <title>Kitco News</title>
      <item><title>Gold rallies to record high</title>
        <link>http://x/1</link><pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate></item>
      <item><title>Silver slips on demand</title>
        <link>http://x/2</link><pubDate>Mon, 01 Jun 2026 09:00:00 GMT</pubDate></item>
    </channel></rss>"""
    data = news.parse_feed(rss)
    assert data["feed"]["title"] == "Kitco News"
    assert len(data["items"]) == 2
    assert data["items"][0]["title"] == "Gold rallies to record high"
    assert data["items"][0]["link"] == "http://x/1"


def test_parse_feed_reads_atom_entries():
    from app.services import news

    atom = """<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>FX Wire</title>
      <entry><title>Dollar firms ahead of Fed</title>
        <link href="http://x/a"/><updated>2026-06-01T10:00:00Z</updated></entry>
    </feed>"""
    data = news.parse_feed(atom)
    assert data["feed"]["title"] == "FX Wire"
    assert data["items"][0]["title"] == "Dollar firms ahead of Fed"
    assert data["items"][0]["link"] == "http://x/a"


def test_parse_feed_rejects_garbage():
    import pytest

    from app.services import news

    with pytest.raises(ValueError):
        news.parse_feed("<<not xml>>")


def test_retail_sentiment_parses_and_flags_contrarian(client, monkeypatch):
    payload = {
        "symbols": [
            {"name": "EURUSD", "longPercentage": 72, "shortPercentage": 28},
            {"name": "XAUUSD", "longPercentage": 45, "shortPercentage": 55},
        ]
    }

    async def fake_fetch():
        return payload

    monkeypatch.setattr("app.services.sentiment.fetch_retail", fake_fetch)
    body = client.get("/api/retail-sentiment", params={"symbol": "EURUSD=X"}).json()
    assert body["longPct"] == 72
    assert body["shortPct"] == 28
    assert body["contrarian"] == "bearish"  # crowd long → contrarian short

    body2 = client.get("/api/retail-sentiment", params={"symbol": "XAU=F"}).json()
    assert body2["contrarian"] == "neutral"
