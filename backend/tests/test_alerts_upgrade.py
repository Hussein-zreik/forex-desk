"""Per-user Telegram linking, owner delivery, and the alert lifecycle."""

import asyncio


def _auth(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_telegram_status_unconfigured(client):
    headers = _auth(client, "tg-status@test.dev")
    body = client.get("/api/telegram/status", headers=headers).json()
    assert body == {"configured": False, "linked": False}


def test_telegram_link_503_when_unconfigured(client):
    headers = _auth(client, "tg-link@test.dev")
    assert client.post("/api/telegram/link", headers=headers).status_code == 503


def test_webhook_rejects_bad_secret(client):
    res = client.post(
        "/api/telegram/webhook",
        json={"message": {"text": "/start x", "chat": {"id": 1}}},
        headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"},
    )
    assert res.status_code == 403


def test_webhook_links_user(client, monkeypatch):
    from app.services import telegram as tg

    sent: list[dict] = []

    async def fake_send(text, chat_id=None):
        sent.append({"text": text, "chat_id": chat_id})
        return True

    monkeypatch.setattr("app.routers.telegram.telegram.send_message", fake_send)
    monkeypatch.setattr("app.services.telegram.settings.telegram_bot_token", "test-token")

    headers = _auth(client, "tg-webhook@test.dev")

    # Mint a link (patch getMe so no network happens).
    async def fake_username():
        return "forexdeskbot"

    monkeypatch.setattr("app.routers.telegram.telegram.get_bot_username", fake_username)
    link = client.post("/api/telegram/link", headers=headers).json()["link"]
    token = link.split("start=")[1]

    res = client.post(
        "/api/telegram/webhook",
        json={"message": {"text": f"/start {token}", "chat": {"id": 424242}}},
        headers={"X-Telegram-Bot-Api-Secret-Token": tg.webhook_secret()},
    )
    assert res.status_code == 200
    assert client.get("/api/telegram/status", headers=headers).json()["linked"] is True
    assert sent and sent[-1]["chat_id"] == "424242" and "Linked" in sent[-1]["text"]

    # Unlink works.
    client.delete("/api/telegram/link", headers=headers)
    assert client.get("/api/telegram/status", headers=headers).json()["linked"] is False


def test_alert_lifecycle_rearm_and_seen(client):
    headers = _auth(client, "lifecycle@test.dev")
    alert = client.post(
        "/api/alerts",
        json={"symbol": "XAU=F", "condition": "ABOVE", "level": 4000, "notify_email": True},
        headers=headers,
    ).json()
    assert alert["status"] == "ACTIVE" and alert["notify_email"] is True

    # Simulate a fired alert directly through the poller's check.
    from app.db.session import SessionLocal
    from app.models.market import QuoteCache
    from app.realtime.poller import check_alerts

    async def seed_and_check():
        async with SessionLocal() as db:
            db.add(QuoteCache(symbol="XAU=F", payload={"price": 4100.0}))
            await db.commit()
        await check_alerts()

    asyncio.run(seed_and_check())

    fired = client.get("/api/alerts", headers=headers).json()[0]
    assert fired["status"] == "HIT"
    assert fired["triggered_price"] == 4100.0
    assert fired["seen"] is False

    # Mark seen.
    seen = client.patch(
        f"/api/alerts/{fired['id']}", json={"seen": True}, headers=headers
    ).json()
    assert seen["seen"] is True

    # Re-arm resets the trigger fields.
    rearmed = client.patch(
        f"/api/alerts/{fired['id']}", json={"status": "ACTIVE"}, headers=headers
    ).json()
    assert rearmed["status"] == "ACTIVE"
    assert rearmed["triggered_at"] is None and rearmed["triggered_price"] is None


def test_alert_update_rejects_bogus_status_and_foreign_alerts(client):
    headers_a = _auth(client, "owner-a@test.dev")
    headers_b = _auth(client, "owner-b@test.dev")
    alert = client.post(
        "/api/alerts",
        json={"symbol": "EURUSD=X", "condition": "BELOW", "level": 1.05},
        headers=headers_a,
    ).json()
    assert (
        client.patch(
            f"/api/alerts/{alert['id']}", json={"status": "HIT"}, headers=headers_a
        ).status_code
        == 400
    )
    assert (
        client.patch(
            f"/api/alerts/{alert['id']}", json={"seen": True}, headers=headers_b
        ).status_code
        == 404
    )


def test_owner_delivery_targets_owner_chat(client, monkeypatch):
    """Two users, same symbol: each DM goes to that alert owner's chat."""
    sent: list[dict] = []

    async def fake_send(text, chat_id=None):
        sent.append({"text": text, "chat_id": chat_id})
        return True

    monkeypatch.setattr("app.realtime.poller.telegram.send_message", fake_send)

    headers_a = _auth(client, "chat-a@test.dev")
    headers_b = _auth(client, "chat-b@test.dev")
    client.post(
        "/api/alerts",
        json={"symbol": "GC=F", "condition": "ABOVE", "level": 100},
        headers=headers_a,
    )
    client.post(
        "/api/alerts",
        json={"symbol": "GC=F", "condition": "ABOVE", "level": 200},
        headers=headers_b,
    )

    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.market import QuoteCache
    from app.models.user import User
    from app.realtime.poller import check_alerts

    async def seed_chats_and_check():
        async with SessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email.in_(["chat-a@test.dev", "chat-b@test.dev"]))
            )
            for user in result.scalars():
                user.telegram_chat_id = "chat-A" if user.email.startswith("chat-a") else "chat-B"
            db.add(QuoteCache(symbol="GC=F", payload={"price": 250.0}))
            await db.commit()
        await check_alerts()

    asyncio.run(seed_chats_and_check())

    chats = {s["chat_id"] for s in sent}
    assert chats == {"chat-A", "chat-B"}
