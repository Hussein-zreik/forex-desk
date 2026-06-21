def test_register_returns_token(client):
    res = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_me_with_token(client):
    token = client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "secret123"},
    ).json()["access_token"]

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "bob@example.com"
    assert res.json()["theme"] == "dark"


def test_login_then_me(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": "secret123"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "carol@example.com", "password": "secret123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email"] == "carol@example.com"


def test_duplicate_email_conflicts(client):
    client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    res = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    assert res.status_code == 409


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "dave@example.com", "password": "secret123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "dave@example.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401
