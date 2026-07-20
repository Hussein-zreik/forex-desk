"""Sign-out-everywhere: token_version bump invalidates prior tokens."""


def _register(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "pass-123"})
    assert res.status_code == 201
    return res.json()["access_token"]


def test_logout_all_invalidates_old_tokens_and_issues_a_fresh_one(client):
    old = _register(client, "logoutall@test.dev")
    old_h = {"Authorization": f"Bearer {old}"}
    assert client.get("/api/auth/me", headers=old_h).status_code == 200

    res = client.post("/api/auth/logout-all", headers=old_h)
    assert res.status_code == 200
    fresh = res.json()["access_token"]
    assert fresh != old

    # The old token is now dead everywhere...
    assert client.get("/api/auth/me", headers=old_h).status_code == 401
    # ...but the returned token keeps this device signed in.
    fresh_h = {"Authorization": f"Bearer {fresh}"}
    assert client.get("/api/auth/me", headers=fresh_h).status_code == 200


def test_second_session_dies_after_logout_all(client):
    """A token minted before the bump (e.g. another device) stops working."""
    _register(client, "twosession@test.dev")
    login = lambda: client.post(  # noqa: E731
        "/api/auth/login", json={"email": "twosession@test.dev", "password": "pass-123"}
    ).json()["access_token"]

    device_a = login()
    device_b = login()  # both valid at version 0
    a_h = {"Authorization": f"Bearer {device_a}"}
    b_h = {"Authorization": f"Bearer {device_b}"}
    assert client.get("/api/auth/me", headers=a_h).status_code == 200
    assert client.get("/api/auth/me", headers=b_h).status_code == 200

    client.post("/api/auth/logout-all", headers=a_h)  # device A signs out everywhere

    # Device B (older token) is now locked out.
    assert client.get("/api/auth/me", headers=b_h).status_code == 401
    # A fresh login still works.
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {login()}"}
    ).status_code == 200


def test_logout_all_requires_auth(client):
    assert client.post("/api/auth/logout-all").status_code in (401, 403)
