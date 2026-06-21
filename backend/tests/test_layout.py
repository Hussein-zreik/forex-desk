def _token(client, email: str) -> str:
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": "secret123"},
    ).json()["access_token"]


def test_layout_empty_by_default(client):
    token = _token(client, "layout1@example.com")
    res = client.get("/api/layout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == {"layouts": {}, "widgets": []}


def test_layout_persists(client):
    token = _token(client, "layout2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "layouts": {"lg": [{"i": "w1", "x": 0, "y": 0, "w": 3, "h": 2}]},
        "widgets": [{"id": "w1", "type": "eurusd"}],
    }
    put = client.put("/api/layout", headers=headers, json=payload)
    assert put.status_code == 200

    got = client.get("/api/layout", headers=headers)
    assert got.json()["widgets"] == [{"id": "w1", "type": "eurusd"}]
    assert got.json()["layouts"]["lg"][0]["i"] == "w1"


def test_layout_requires_auth(client):
    assert client.get("/api/layout").status_code == 401
