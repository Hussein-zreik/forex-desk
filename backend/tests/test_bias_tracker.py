"""Bias snapshots: dedupe, outcome grading, retention, and the API."""

import asyncio
from datetime import UTC, datetime, timedelta

from app.services.bias_tracker import grade


def test_grade_matches_direction():
    assert grade(50, 100.0, 105.0) == "CORRECT"  # bullish call, price up
    assert grade(50, 100.0, 95.0) == "WRONG"
    assert grade(-50, 100.0, 95.0) == "CORRECT"  # bearish call, price down
    assert grade(-50, 100.0, 105.0) == "WRONG"


def test_grade_neutral_on_no_call_or_noise():
    assert grade(0, 100.0, 120.0) == "NEUTRAL"  # score 0 = no call
    assert grade(50, 100.0, 100.02) == "NEUTRAL"  # 0.02% move < noise floor


def _fake_composite(score: int):
    async def fake(db, symbol):
        return {
            "symbol": symbol,
            "signals": [{"label": "Macro Regime", "dir": "bull"}],
            "score": score,
            "label": "BULLISH" if score > 20 else "BEARISH" if score < -20 else "NEUTRAL",
            "bullish": 1,
            "bearish": 0,
        }

    return fake


def _seed_price(db_add, symbol: str, price: float):
    from app.models.market import QuoteCache

    db_add(QuoteCache(symbol=symbol, payload={"price": price}))


def test_snapshot_tick_dedupes_and_grades(client, monkeypatch):
    """Two ticks in the same hour → one row; horizons grade with later prices."""
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.bias import BiasSnapshot
    from app.models.market import QuoteCache
    from app.services import bias_tracker

    monkeypatch.setattr(bias_tracker, "compute_composite", _fake_composite(67))
    monkeypatch.setattr(bias_tracker, "SNAPSHOT_SYMBOLS", ["XAU=F"])

    t0 = datetime(2026, 7, 1, 10, 30, tzinfo=UTC)

    async def run():
        async with SessionLocal() as db:
            _seed_price(db.add, "XAU=F", 4000.0)
            await db.commit()
            await bias_tracker.snapshot_tick(db, now=t0)
            await bias_tracker.snapshot_tick(db, now=t0 + timedelta(minutes=20))  # same hour

            rows = list((await db.execute(select(BiasSnapshot))).scalars())
            assert len(rows) == 1
            assert rows[0].bucket == "2026-07-01T10"
            assert rows[0].price_at == 4000.0
            assert rows[0].outcome_1d is None

            # A day later at a higher price the bullish call grades CORRECT.
            cache = await db.get(QuoteCache, "XAU=F")
            cache.payload = {"price": 4100.0}
            await db.commit()
            await bias_tracker.snapshot_tick(db, now=t0 + timedelta(days=1, minutes=5))

            snap = (await db.execute(select(BiasSnapshot))).scalars().first()
            assert snap.outcome_1d == "CORRECT"
            assert snap.price_1d == 4100.0
            assert snap.outcome_1w is None  # week horizon not reached

    asyncio.run(run())


def test_snapshot_retention_prunes_old_rows(client, monkeypatch):
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.bias import BiasSnapshot
    from app.services import bias_tracker

    monkeypatch.setattr(bias_tracker, "compute_composite", _fake_composite(0))
    monkeypatch.setattr(bias_tracker, "SNAPSHOT_SYMBOLS", [])

    now = datetime(2026, 7, 1, tzinfo=UTC)

    async def run():
        async with SessionLocal() as db:
            db.add(
                BiasSnapshot(
                    symbol="XAU=F",
                    bucket="2025-12-01T10",
                    taken_at=now - timedelta(days=200),
                    score=10,
                    label="NEUTRAL",
                    signals=[],
                    price_at=100.0,
                )
            )
            db.add(
                BiasSnapshot(
                    symbol="XAU=F",
                    bucket="2026-06-30T10",
                    taken_at=now - timedelta(days=1),
                    score=10,
                    label="NEUTRAL",
                    signals=[],
                    price_at=100.0,
                )
            )
            await db.commit()
            await bias_tracker.snapshot_tick(db, now=now)
            buckets = [
                s.bucket for s in (await db.execute(select(BiasSnapshot))).scalars()
            ]
            assert buckets == ["2026-06-30T10"]

    asyncio.run(run())


def test_bias_history_and_stats_endpoints(client):
    import asyncio as aio

    from app.db.session import SessionLocal
    from app.models.bias import BiasSnapshot

    async def seed():
        async with SessionLocal() as db:
            for hour, outcome in [(10, "CORRECT"), (11, "CORRECT"), (12, "WRONG"), (13, None)]:
                db.add(
                    BiasSnapshot(
                        symbol="XAU=F",
                        bucket=f"2026-07-01T{hour}",
                        score=50,
                        label="BULLISH",
                        signals=[{"label": "Macro Regime", "dir": "bull"}],
                        price_at=4000.0,
                        outcome_1d=outcome,
                    )
                )
            await db.commit()

    aio.run(seed())

    history = client.get("/api/bias/history", params={"symbol": "XAU=F"}).json()
    assert len(history["points"]) == 4
    assert history["points"][0]["bucket"] == "2026-07-01T10"

    stats = client.get("/api/bias/stats", params={"symbol": "XAU=F"}).json()
    assert stats["snapshots"] == 4
    assert stats["h1d"] == {"correct": 2, "wrong": 1, "n": 3, "hit_rate": 66.7}
    assert stats["h1w"]["n"] == 0 and stats["h1w"]["hit_rate"] is None


def test_composite_route_still_works(client, monkeypatch):
    """The extraction to services/bias.py must not change the route contract."""

    async def fake_compute(db, symbol):
        return {
            "symbol": symbol,
            "signals": [],
            "score": 0,
            "label": "NEUTRAL",
            "bullish": 0,
            "bearish": 0,
        }

    monkeypatch.setattr("app.routers.widgets.bias_service.compute_composite", fake_compute)
    body = client.get("/api/indicators/composite", params={"symbol": "XAU=F"}).json()
    assert body["symbol"] == "XAU=F"
    assert set(body) == {"symbol", "signals", "score", "label", "bullish", "bearish"}
