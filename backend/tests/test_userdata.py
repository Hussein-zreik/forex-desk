from app.realtime.poller import alert_hit


def _token(client, email: str) -> str:
    return client.post("/api/auth/register", json={"email": email, "password": "secret123"}).json()[
        "access_token"
    ]


def test_eco_surprises_default(client):
    headers = {"Authorization": f"Bearer {_token(client, 'eco1@example.com')}"}
    data = client.get("/api/eco-surprises", headers=headers).json()
    assert len(data) == 8
    assert all(d["beats"] == 0 and d["misses"] == 0 for d in data)


def test_eco_adjust_and_floor(client):
    headers = {"Authorization": f"Bearer {_token(client, 'eco2@example.com')}"}
    res = client.post(
        "/api/eco-surprises",
        headers=headers,
        json={"currency": "USD", "field": "beats", "delta": 2},
    )
    assert res.json()["beats"] == 2
    client.post(
        "/api/eco-surprises",
        headers=headers,
        json={"currency": "USD", "field": "beats", "delta": -5},
    )
    usd = next(
        d
        for d in client.get("/api/eco-surprises", headers=headers).json()
        if d["currency"] == "USD"
    )
    assert usd["beats"] == 0  # floored


def test_alerts_crud(client):
    headers = {"Authorization": f"Bearer {_token(client, 'alert1@example.com')}"}
    created = client.post(
        "/api/alerts",
        headers=headers,
        json={"symbol": "XAU=F", "condition": "above", "level": 2400},
    )
    assert created.status_code == 201
    assert created.json()["condition"] == "ABOVE"
    alert_id = created.json()["id"]

    assert len(client.get("/api/alerts", headers=headers).json()) == 1

    assert client.delete(f"/api/alerts/{alert_id}", headers=headers).status_code == 204
    assert client.get("/api/alerts", headers=headers).json() == []


def test_alerts_require_auth(client):
    assert client.get("/api/alerts").status_code == 401


def test_alert_hit_logic():
    assert alert_hit("ABOVE", 100, 150) is True
    assert alert_hit("ABOVE", 100, 90) is False
    assert alert_hit("BELOW", 100, 90) is True
    assert alert_hit("BELOW", 100, 150) is False
