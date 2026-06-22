def _token(client, email: str) -> str:
    return client.post("/api/auth/register", json={"email": email, "password": "secret123"}).json()[
        "access_token"
    ]


def test_journal_crud(client):
    headers = {"Authorization": f"Bearer {_token(client, 'j1@example.com')}"}

    created = client.post(
        "/api/journal",
        headers=headers,
        json={
            "symbol": "XAU=F",
            "direction": "long",
            "pnl": 250.0,
            "traded_on": "2026-06-10",
            "session": "London",
            "mistake": "",
            "notes": "clean breakout",
        },
    )
    assert created.status_code == 201
    assert created.json()["direction"] == "LONG"
    entry_id = created.json()["id"]

    listed = client.get("/api/journal", headers=headers).json()
    assert len(listed) == 1
    assert listed[0]["pnl"] == 250.0

    assert client.delete(f"/api/journal/{entry_id}", headers=headers).status_code == 204
    assert client.get("/api/journal", headers=headers).json() == []


def test_journal_sorted_by_date(client):
    headers = {"Authorization": f"Bearer {_token(client, 'j2@example.com')}"}
    for d in ("2026-06-15", "2026-06-01", "2026-06-10"):
        client.post(
            "/api/journal",
            headers=headers,
            json={"symbol": "EURUSD=X", "direction": "SHORT", "pnl": 10, "traded_on": d},
        )
    dates = [e["traded_on"] for e in client.get("/api/journal", headers=headers).json()]
    assert dates == ["2026-06-01", "2026-06-10", "2026-06-15"]


def test_journal_requires_auth(client):
    assert client.get("/api/journal").status_code == 401
