def _token(client, email: str) -> str:
    return client.post("/api/auth/register", json={"email": email, "password": "secret123"}).json()[
        "access_token"
    ]


def test_portfolio_empty(client):
    headers = {"Authorization": f"Bearer {_token(client, 'pf1@example.com')}"}
    body = client.get("/api/portfolio", headers=headers).json()
    assert body["positions"] == []
    assert body["stats"]["openCount"] == 0


def test_portfolio_pnl_with_seeded_quote(client, monkeypatch):
    headers = {"Authorization": f"Bearer {_token(client, 'pf2@example.com')}"}

    chart = {
        "chart": {
            "result": [{"meta": {"regularMarketPrice": 2400.0, "chartPreviousClose": 2350.0}}]
        }
    }

    async def fake_chart(symbol):
        return chart

    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_chart)

    created = client.post(
        "/api/portfolio",
        headers=headers,
        json={"symbol": "XAU=F", "side": "long", "size": 2, "entry_price": 2350.0},
    )
    assert created.status_code == 201
    assert created.json()["side"] == "LONG"
    # (2400 - 2350) * 2 * +1 = 100
    assert created.json()["pnl"] == 100.0

    body = client.get("/api/portfolio", headers=headers).json()
    assert body["stats"]["openCount"] == 1
    assert body["stats"]["totalPnl"] == 100.0


def test_portfolio_delete(client):
    headers = {"Authorization": f"Bearer {_token(client, 'pf3@example.com')}"}
    created = client.post(
        "/api/portfolio",
        headers=headers,
        json={"symbol": "EURUSD=X", "side": "SHORT", "size": 1, "entry_price": 1.1},
    )
    pid = created.json()["id"]
    assert client.delete(f"/api/portfolio/{pid}", headers=headers).status_code == 204
    assert client.get("/api/portfolio", headers=headers).json()["positions"] == []


def test_portfolio_requires_auth(client):
    assert client.get("/api/portfolio").status_code == 401
