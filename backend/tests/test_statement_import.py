"""MT4/MT5 statement parsing, import dedupe, and bias alignment."""

import asyncio
from pathlib import Path

from app.services.statement_import import normalize_symbol, parse_statement

_FIXTURES = Path(__file__).parent / "fixtures"


def _auth(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_normalize_symbol():
    assert normalize_symbol("XAUUSD") == "XAU=F"
    assert normalize_symbol("xauusd.m") == "XAU=F"
    assert normalize_symbol("EURUSD") == "EURUSD=X"
    assert normalize_symbol("gbpusd-pro") == "GBPUSD=X"
    assert normalize_symbol("BTCUSD") == "BTC-USD"
    assert normalize_symbol("US500") == "^GSPC"


def test_parse_mt4_html_statement():
    trades, errors = parse_statement((_FIXTURES / "mt4_statement.html").read_bytes())
    assert errors == []
    assert len(trades) == 2  # balance + summary rows skipped
    assert trades[0] == {
        "ticket": "10001001",
        "symbol": "XAU=F",
        "direction": "LONG",
        "pnl": 115.0,
        "close_date": "2026-07-01",
    }
    assert trades[1]["symbol"] == "EURUSD=X"
    assert trades[1]["direction"] == "SHORT"
    assert trades[1]["pnl"] == -50.0


def test_parse_mt5_csv_report():
    trades, errors = parse_statement((_FIXTURES / "mt5_report.csv").read_bytes())
    assert errors == []
    assert [t["ticket"] for t in trades] == ["20002001", "20002002"]
    assert trades[1]["symbol"] == "XAU=F"
    assert trades[1]["close_date"] == "2026-07-06"


def test_parse_garbage_raises():
    import pytest

    with pytest.raises(ValueError):
        parse_statement(b"this is not a statement at all")


def test_import_endpoint_dedupes_on_reimport(client):
    headers = _auth(client, "import@test.dev")
    payload = (_FIXTURES / "mt4_statement.html").read_bytes()

    first = client.post(
        "/api/journal/import",
        files={"file": ("statement.html", payload, "text/html")},
        headers=headers,
    ).json()
    assert first == {"imported": 2, "skipped": 0, "errors": []}

    second = client.post(
        "/api/journal/import",
        files={"file": ("statement.html", payload, "text/html")},
        headers=headers,
    ).json()
    assert second == {"imported": 0, "skipped": 2, "errors": []}

    entries = client.get("/api/journal", headers=headers).json()
    assert len(entries) == 2
    assert {e["symbol"] for e in entries} == {"XAU=F", "EURUSD=X"}


def test_import_endpoint_rejects_garbage(client):
    headers = _auth(client, "import-bad@test.dev")
    res = client.post(
        "/api/journal/import",
        files={"file": ("junk.txt", b"nothing here", "text/plain")},
        headers=headers,
    )
    assert res.status_code == 422


def test_bias_alignment_groups(client):
    headers = _auth(client, "align@test.dev")

    # Trades: two on a bullish-snapshot day (one LONG=with, one SHORT=against),
    # one on a day with no snapshot (no_data).
    for body in [
        {"symbol": "XAU=F", "direction": "LONG", "pnl": 80, "traded_on": "2026-07-01"},
        {"symbol": "XAU=F", "direction": "SHORT", "pnl": -30, "traded_on": "2026-07-01"},
        {"symbol": "XAU=F", "direction": "LONG", "pnl": 10, "traded_on": "2026-07-04"},
    ]:
        assert client.post("/api/journal", json=body, headers=headers).status_code == 201

    from app.db.session import SessionLocal
    from app.models.bias import BiasSnapshot

    async def seed():
        async with SessionLocal() as db:
            for hour in ("08", "16"):  # latest bucket of the day wins
                db.add(
                    BiasSnapshot(
                        symbol="XAU=F",
                        bucket=f"2026-07-01T{hour}",
                        score=67 if hour == "16" else -33,
                        label="BULLISH",
                        signals=[],
                        price_at=4000.0,
                    )
                )
            await db.commit()

    asyncio.run(seed())

    body = client.get("/api/journal/bias-alignment", headers=headers).json()
    assert body["with"] == {"n": 1, "win_rate": 100.0, "avg_pnl": 80.0}
    assert body["against"] == {"n": 1, "win_rate": 0.0, "avg_pnl": -30.0}
    assert body["no_data"]["n"] == 1
