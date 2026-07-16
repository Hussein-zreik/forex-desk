"""Password reset + email verification flows (console email provider)."""


def _capture_links(monkeypatch):
    """Monkeypatch send_email to capture the tokenized links it would send."""
    sent: list[dict] = []

    async def fake_send(to: str, subject: str, html: str) -> bool:
        sent.append({"to": to, "subject": subject, "html": html})
        return True

    monkeypatch.setattr("app.routers.auth.email_service.send_email", fake_send)
    return sent


def _token_from(html: str) -> str:
    return html.split("token=")[1].split('"')[0]


def _register(client, email="reset@test.dev", password="original-pass"):
    res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    return res.json()["access_token"]


def test_full_reset_round_trip(client, monkeypatch):
    sent = _capture_links(monkeypatch)
    _register(client, "roundtrip@test.dev")

    assert client.post(
        "/api/auth/forgot-password", json={"email": "roundtrip@test.dev"}
    ).status_code == 200
    token = _token_from(sent[-1]["html"])
    assert sent[-1]["to"] == "roundtrip@test.dev"

    res = client.post(
        "/api/auth/reset-password", json={"token": token, "new_password": "brand-new-pass"}
    )
    assert res.status_code == 200

    # Old password dead, new one works.
    assert (
        client.post(
            "/api/auth/login", json={"email": "roundtrip@test.dev", "password": "original-pass"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": "roundtrip@test.dev", "password": "brand-new-pass"}
        ).status_code
        == 200
    )


def test_reset_token_is_single_use(client, monkeypatch):
    sent = _capture_links(monkeypatch)
    _register(client, "single@test.dev")
    client.post("/api/auth/forgot-password", json={"email": "single@test.dev"})
    token = _token_from(sent[-1]["html"])

    assert (
        client.post(
            "/api/auth/reset-password", json={"token": token, "new_password": "pw-one"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/reset-password", json={"token": token, "new_password": "pw-two"}
        ).status_code
        == 400
    )


def test_newer_reset_link_invalidates_older(client, monkeypatch):
    sent = _capture_links(monkeypatch)
    _register(client, "newest@test.dev")
    client.post("/api/auth/forgot-password", json={"email": "newest@test.dev"})
    first = _token_from(sent[-1]["html"])
    client.post("/api/auth/forgot-password", json={"email": "newest@test.dev"})
    second = _token_from(sent[-1]["html"])

    assert (
        client.post(
            "/api/auth/reset-password", json={"token": first, "new_password": "x-pass"}
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/auth/reset-password", json={"token": second, "new_password": "x-pass"}
        ).status_code
        == 200
    )


def test_forgot_password_unknown_email_still_200(client, monkeypatch):
    sent = _capture_links(monkeypatch)
    res = client.post("/api/auth/forgot-password", json={"email": "ghost@test.dev"})
    assert res.status_code == 200
    assert sent == []  # nothing sent, nothing leaked


def test_garbage_reset_token_rejected(client):
    res = client.post(
        "/api/auth/reset-password", json={"token": "not-a-real-token", "new_password": "pw"}
    )
    assert res.status_code == 400


def test_email_verification_flow(client, monkeypatch):
    sent = _capture_links(monkeypatch)
    access = _register(client, "verifyme@test.dev")
    headers = {"Authorization": f"Bearer {access}"}

    # Registration queued a verification email; user starts unverified.
    assert client.get("/api/auth/me", headers=headers).json()["email_verified"] is False
    token = _token_from(sent[-1]["html"])

    assert client.post("/api/auth/verify-email", json={"token": token}).status_code == 200
    assert client.get("/api/auth/me", headers=headers).json()["email_verified"] is True

    # Resend after verification is a friendly no-op.
    res = client.post("/api/auth/resend-verification", headers=headers)
    assert res.status_code == 200
    assert res.json().get("already_verified") is True


def test_auth_config_reports_email_capability(client):
    body = client.get("/api/auth/config").json()
    assert body == {"email_configured": False}  # console provider in tests
