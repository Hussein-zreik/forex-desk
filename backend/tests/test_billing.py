"""Billing: webhook as source of truth, plan gates, unconfigured behavior."""

import asyncio


def _auth(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}, res


def _configure(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "stripe_secret_key", "sk_test_x")
    monkeypatch.setattr(settings, "stripe_price_id_pro", "price_x")
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_x")


def _fake_event(monkeypatch, event: dict):
    monkeypatch.setattr("app.services.billing.parse_event", lambda payload, sig: event)


def _user_id(client, headers) -> str:
    return client.get("/api/auth/me", headers=headers).json()["id"]


def test_unconfigured_no_gates_and_503_checkout(client):
    headers, _ = _auth(client, "nogates@test.dev")
    # Unlimited alerts when billing is unconfigured.
    for i in range(5):
        res = client.post(
            "/api/alerts",
            json={"symbol": "XAU=F", "condition": "ABOVE", "level": 1000 + i},
            headers=headers,
        )
        assert res.status_code == 201
    body = client.get("/api/billing/status", headers=headers).json()
    assert body["configured"] is False and body["plan"] == "pro"
    assert client.post("/api/billing/checkout", headers=headers).status_code == 503


def test_webhook_rejects_bad_signature(client, monkeypatch):
    _configure(monkeypatch)

    def boom(payload, sig):
        raise ValueError("bad signature")

    monkeypatch.setattr("app.services.billing.parse_event", boom)
    res = client.post(
        "/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "t=1,v1=nope"}
    )
    assert res.status_code == 400


def test_free_plan_gates_alerts_and_email(client, monkeypatch):
    _configure(monkeypatch)
    headers, _ = _auth(client, "gated@test.dev")

    for i in range(3):
        assert (
            client.post(
                "/api/alerts",
                json={"symbol": "XAU=F", "condition": "ABOVE", "level": 100 + i},
                headers=headers,
            ).status_code
            == 201
        )
    fourth = client.post(
        "/api/alerts",
        json={"symbol": "XAU=F", "condition": "ABOVE", "level": 999},
        headers=headers,
    )
    assert fourth.status_code == 403
    assert "upgrade" in fourth.json()["detail"].lower()

    email_alert = client.post(
        "/api/alerts",
        json={"symbol": "EURUSD=X", "condition": "BELOW", "level": 1, "notify_email": True},
        headers=headers,
    )
    assert email_alert.status_code == 403


def test_checkout_webhook_unlocks_pro(client, monkeypatch):
    _configure(monkeypatch)
    headers, _ = _auth(client, "upgrader@test.dev")
    user_id = _user_id(client, headers)

    assert client.get("/api/billing/status", headers=headers).json()["plan"] == "free"

    _fake_event(
        monkeypatch,
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": user_id,
                    "customer": "cus_123",
                    "subscription": "sub_123",
                }
            },
        },
    )
    res = client.post("/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "sig"})
    assert res.json() == {"ok": True, "handled": True}

    body = client.get("/api/billing/status", headers=headers).json()
    assert body["plan"] == "pro"
    assert body["limits"]["max_active_alerts"] is None

    # Pro: the 4th alert and the email channel are allowed.
    for i in range(4):
        assert (
            client.post(
                "/api/alerts",
                json={
                    "symbol": "XAU=F",
                    "condition": "ABOVE",
                    "level": 200 + i,
                    "notify_email": i == 3,
                },
                headers=headers,
            ).status_code
            == 201
        )


def test_subscription_deleted_downgrades_gracefully(client, monkeypatch):
    _configure(monkeypatch)
    headers, _ = _auth(client, "churner@test.dev")
    user_id = _user_id(client, headers)

    _fake_event(
        monkeypatch,
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": user_id,
                    "customer": "cus_9",
                    "subscription": "sub_9",
                }
            },
        },
    )
    client.post("/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "s"})

    # While pro, create 4 alerts.
    for i in range(4):
        client.post(
            "/api/alerts",
            json={"symbol": "GC=F", "condition": "ABOVE", "level": 10 + i},
            headers=headers,
        )

    _fake_event(
        monkeypatch,
        {
            "type": "customer.subscription.deleted",
            "data": {"object": {"id": "sub_9", "status": "canceled"}},
        },
    )
    client.post("/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "s"})

    body = client.get("/api/billing/status", headers=headers).json()
    assert body["plan"] == "free"
    # Existing alerts are kept (graceful downgrade)…
    assert len(client.get("/api/alerts", headers=headers).json()) == 4
    # …but adding another is gated now.
    assert (
        client.post(
            "/api/alerts",
            json={"symbol": "GC=F", "condition": "ABOVE", "level": 99},
            headers=headers,
        ).status_code
        == 403
    )


def test_free_journal_window(client, monkeypatch):
    _configure(monkeypatch)
    headers, _ = _auth(client, "window@test.dev")

    from datetime import UTC, datetime, timedelta

    recent = datetime.now(UTC).strftime("%Y-%m-%d")
    old = (datetime.now(UTC) - timedelta(days=120)).strftime("%Y-%m-%d")
    for day in (recent, old):
        client.post(
            "/api/journal",
            json={"symbol": "XAU=F", "direction": "LONG", "pnl": 1, "traded_on": day},
            headers=headers,
        )

    listed = client.get("/api/journal", headers=headers).json()
    assert [e["traded_on"] for e in listed] == [recent]  # 120-day-old entry hidden, not deleted

    # Upgrade → full history returns.
    user_id = _user_id(client, headers)
    _fake_event(
        monkeypatch,
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": user_id,
                    "customer": "c",
                    "subscription": "s1",
                }
            },
        },
    )
    client.post("/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "s"})
    assert len(client.get("/api/journal", headers=headers).json()) == 2


def test_portal_requires_subscription(client, monkeypatch):
    _configure(monkeypatch)
    headers, _ = _auth(client, "noportal@test.dev")
    assert client.post("/api/billing/portal", headers=headers).status_code == 404


def _noop(*args, **kwargs):
    return None


def test_apply_event_ignores_unknown_types(client):
    from app.db.session import SessionLocal
    from app.services.billing import apply_event

    async def run():
        async with SessionLocal() as db:
            return await apply_event(db, {"type": "invoice.paid", "data": {"object": {}}})

    assert asyncio.run(run()) is False
