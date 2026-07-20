"""Alert-hit history: recorded on fire, survives re-arm/delete, retention prune."""

import asyncio
from datetime import UTC, datetime, timedelta

from app.crud.widgets import ALERT_HISTORY_RETENTION_DAYS, prune_alert_hits
from app.db.session import SessionLocal
from app.models.market import QuoteCache
from app.models.widgets import AlertHit
from app.realtime.poller import check_alerts


def _auth(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "pass-123"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_history_empty_by_default(client):
    headers = _auth(client, "hist-empty@test.dev")
    assert client.get("/api/alerts/history", headers=headers).json() == []


def test_fire_records_history_and_survives_rearm(client):
    headers = _auth(client, "hist-fire@test.dev")
    alert = client.post(
        "/api/alerts",
        json={"symbol": "XAU=F", "condition": "ABOVE", "level": 4000},
        headers=headers,
    ).json()

    async def seed_and_fire():
        async with SessionLocal() as db:
            db.add(QuoteCache(symbol="XAU=F", payload={"price": 4100.0}))
            await db.commit()
        await check_alerts()

    asyncio.run(seed_and_fire())

    hist = client.get("/api/alerts/history", headers=headers).json()
    assert len(hist) == 1
    assert hist[0]["symbol"] == "XAU=F"
    assert hist[0]["price"] == 4100.0
    assert hist[0]["condition"] == "ABOVE"

    # Re-arm the alert — history must remain.
    client.patch(f"/api/alerts/{alert['id']}", json={"status": "ACTIVE"}, headers=headers)
    assert len(client.get("/api/alerts/history", headers=headers).json()) == 1

    # Delete the alert — history still remains (alert_id detached, not FK-cascaded).
    client.delete(f"/api/alerts/{alert['id']}", headers=headers)
    assert len(client.get("/api/alerts/history", headers=headers).json()) == 1


def test_history_is_per_user(client):
    a = _auth(client, "hist-a@test.dev")
    b = _auth(client, "hist-b@test.dev")
    client.post(
        "/api/alerts", json={"symbol": "GC=F", "condition": "ABOVE", "level": 100}, headers=a
    )

    async def fire():
        async with SessionLocal() as db:
            db.add(QuoteCache(symbol="GC=F", payload={"price": 250.0}))
            await db.commit()
        await check_alerts()

    asyncio.run(fire())

    assert len(client.get("/api/alerts/history", headers=a).json()) == 1
    assert client.get("/api/alerts/history", headers=b).json() == []


def test_prune_drops_old_hits(client):
    headers = _auth(client, "hist-prune@test.dev")
    me = client.get("/api/auth/me", headers=headers).json()

    async def seed_old_and_prune():
        async with SessionLocal() as db:
            old = datetime.now(UTC) - timedelta(days=ALERT_HISTORY_RETENTION_DAYS + 5)
            db.add(
                AlertHit(
                    user_id=me["id"],
                    symbol="XAU=F",
                    condition="ABOVE",
                    level=1,
                    price=2,
                    fired_at=old,
                )
            )
            await db.commit()
        async with SessionLocal() as db:
            await prune_alert_hits(db)

    asyncio.run(seed_old_and_prune())
    assert client.get("/api/alerts/history", headers=headers).json() == []


def test_history_requires_auth(client):
    assert client.get("/api/alerts/history").status_code in (401, 403)
