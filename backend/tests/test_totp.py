"""TOTP 2FA: enrollment, two-step login, replay protection, disable."""

import pyotp

from app.core.security import create_challenge_token, decode_token


def _register(client, email="totp@test.dev", password="pass-123"):
    res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _enroll(client, headers):
    """Run setup + enable; return the shared secret."""
    setup = client.post("/api/auth/totp/setup", headers=headers)
    assert setup.status_code == 200
    body = setup.json()
    assert body["otpauth_url"].startswith("otpauth://totp/")
    secret = body["secret"]
    res = client.post(
        "/api/auth/totp/enable", json={"code": pyotp.TOTP(secret).now()}, headers=headers
    )
    assert res.status_code == 200
    return secret


def test_enroll_and_two_step_login(client):
    headers = _register(client, "twostep@test.dev")
    secret = _enroll(client, headers)
    assert client.get("/api/auth/me", headers=headers).json()["totp_enabled"] is True

    # Password alone now yields a challenge, not a bearer token.
    res = client.post(
        "/api/auth/login", json={"email": "twostep@test.dev", "password": "pass-123"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["totp_required"] is True
    assert "access_token" not in body
    challenge = body["challenge_token"]

    res = client.post(
        "/api/auth/totp/verify",
        json={"challenge_token": challenge, "code": pyotp.TOTP(secret).now()},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert (
        client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    )


def test_enable_requires_matching_code(client):
    headers = _register(client, "badenable@test.dev")
    assert client.post("/api/auth/totp/setup", headers=headers).status_code == 200
    res = client.post("/api/auth/totp/enable", json={"code": "000000"}, headers=headers)
    assert res.status_code == 400
    # Never confirmed → login stays single-step.
    assert client.get("/api/auth/me", headers=headers).json()["totp_enabled"] is False
    body = client.post(
        "/api/auth/login", json={"email": "badenable@test.dev", "password": "pass-123"}
    ).json()
    assert "access_token" in body


def test_challenge_token_is_not_an_access_token(client):
    headers = _register(client, "scope@test.dev")
    _enroll(client, headers)
    body = client.post(
        "/api/auth/login", json={"email": "scope@test.dev", "password": "pass-123"}
    ).json()
    challenge = body["challenge_token"]
    # The scoped challenge JWT must be refused everywhere an access token works.
    assert decode_token(challenge) is None
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {challenge}"})
    assert res.status_code == 401


def test_access_token_is_not_a_challenge_token(client):
    headers = _register(client, "reverse@test.dev")
    secret = _enroll(client, headers)
    access = headers["Authorization"].removeprefix("Bearer ")
    res = client.post(
        "/api/auth/totp/verify",
        json={"challenge_token": access, "code": pyotp.TOTP(secret).now()},
    )
    assert res.status_code == 401


def test_wrong_code_and_replay_rejected(client):
    headers = _register(client, "replay@test.dev")
    secret = _enroll(client, headers)

    def challenge():
        body = client.post(
            "/api/auth/login", json={"email": "replay@test.dev", "password": "pass-123"}
        ).json()
        return body["challenge_token"]

    assert (
        client.post(
            "/api/auth/totp/verify", json={"challenge_token": challenge(), "code": "123456"}
        ).status_code
        == 401
    )

    code = pyotp.TOTP(secret).now()
    assert (
        client.post(
            "/api/auth/totp/verify", json={"challenge_token": challenge(), "code": code}
        ).status_code
        == 200
    )
    # Same (still time-valid) code again → refused.
    assert (
        client.post(
            "/api/auth/totp/verify", json={"challenge_token": challenge(), "code": code}
        ).status_code
        == 401
    )


def test_disable_restores_single_step_login(client):
    headers = _register(client, "disable@test.dev")
    secret = _enroll(client, headers)

    res = client.post(
        "/api/auth/totp/disable", json={"code": pyotp.TOTP(secret).now()}, headers=headers
    )
    assert res.status_code == 200
    assert client.get("/api/auth/me", headers=headers).json()["totp_enabled"] is False

    body = client.post(
        "/api/auth/login", json={"email": "disable@test.dev", "password": "pass-123"}
    ).json()
    assert "access_token" in body


def test_setup_conflicts_once_enabled(client):
    headers = _register(client, "conflict@test.dev")
    _enroll(client, headers)
    assert client.post("/api/auth/totp/setup", headers=headers).status_code == 409


def test_verify_rejects_unenrolled_user(client):
    _register(client, "noenroll@test.dev")
    body = client.post(
        "/api/auth/login", json={"email": "noenroll@test.dev", "password": "pass-123"}
    ).json()
    assert "access_token" in body  # no challenge issued...
    # ...and a forged challenge for that user still fails (2FA not enabled).
    user_id = decode_token(body["access_token"])
    forged = create_challenge_token(user_id)
    res = client.post(
        "/api/auth/totp/verify", json={"challenge_token": forged, "code": "123456"}
    )
    assert res.status_code == 401
