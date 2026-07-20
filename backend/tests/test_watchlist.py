"""Per-user watchlist: defaults, customization, validation."""

from app.core.symbols import DEFAULT_WATCHLIST, MAX_WATCHLIST_SYMBOLS


def _register(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "pass-123"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_watchlist_defaults_until_customized(client):
    headers = _register(client, "wl-default@test.dev")
    body = client.get("/api/watchlist", headers=headers).json()
    assert body["symbols"] == DEFAULT_WATCHLIST
    assert {"symbol": "XAU=F", "label": "XAU/USD"} in body["catalog"]


def test_watchlist_put_preserves_order_and_dedupes(client):
    headers = _register(client, "wl-order@test.dev")
    res = client.put(
        "/api/watchlist",
        json={"symbols": ["^GSPC", "XAU=F", "EURUSD=X", "XAU=F"]},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["symbols"] == ["^GSPC", "XAU=F", "EURUSD=X"]
    # Round-trips on GET.
    assert client.get("/api/watchlist", headers=headers).json()["symbols"] == [
        "^GSPC",
        "XAU=F",
        "EURUSD=X",
    ]


def test_watchlist_rejects_unknown_symbol(client):
    headers = _register(client, "wl-unknown@test.dev")
    res = client.put(
        "/api/watchlist", json={"symbols": ["XAU=F", "EVIL'; DROP--"]}, headers=headers
    )
    assert res.status_code == 400


def test_watchlist_rejects_empty(client):
    headers = _register(client, "wl-bounds@test.dev")
    assert client.put("/api/watchlist", json={"symbols": []}, headers=headers).status_code == 400
    # The size cap only bites once the catalog outgrows it.
    assert len(DEFAULT_WATCHLIST) <= MAX_WATCHLIST_SYMBOLS


def test_watchlist_requires_auth(client):
    assert client.get("/api/watchlist").status_code in (401, 403)


def test_alert_rejects_off_catalog_symbol(client):
    headers = _register(client, "wl-alert@test.dev")
    res = client.post(
        "/api/alerts",
        json={"symbol": "NOT-REAL", "condition": "ABOVE", "level": 1},
        headers=headers,
    )
    assert res.status_code == 400
