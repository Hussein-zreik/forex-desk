"""Change-password endpoint (authenticated, verifies the current password)."""


def _register(client, email, password="original-pass"):
    res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_change_password_round_trip(client):
    headers = _register(client, "changepw@test.dev")
    res = client.post(
        "/api/auth/change-password",
        json={"current_password": "original-pass", "new_password": "brand-new-pass"},
        headers=headers,
    )
    assert res.status_code == 200

    assert (
        client.post(
            "/api/auth/login", json={"email": "changepw@test.dev", "password": "original-pass"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": "changepw@test.dev", "password": "brand-new-pass"}
        ).status_code
        == 200
    )


def test_change_password_requires_correct_current(client):
    headers = _register(client, "wrongcurrent@test.dev")
    res = client.post(
        "/api/auth/change-password",
        json={"current_password": "not-my-password", "new_password": "whatever-else"},
        headers=headers,
    )
    assert res.status_code == 400
    # Unchanged: original still logs in.
    assert (
        client.post(
            "/api/auth/login", json={"email": "wrongcurrent@test.dev", "password": "original-pass"}
        ).status_code
        == 200
    )


def test_change_password_rejects_short_new_password(client):
    headers = _register(client, "shortpw@test.dev")
    res = client.post(
        "/api/auth/change-password",
        json={"current_password": "original-pass", "new_password": "short"},
        headers=headers,
    )
    assert res.status_code == 400


def test_change_password_requires_auth(client):
    res = client.post(
        "/api/auth/change-password",
        json={"current_password": "x", "new_password": "y-long-enough"},
    )
    assert res.status_code in (401, 403)
