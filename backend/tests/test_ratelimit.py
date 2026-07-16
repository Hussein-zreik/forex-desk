from app.core.ratelimit import SlidingWindow, rate_limit  # noqa: F401 (import sanity)


def test_sliding_window_allows_until_limit():
    w = SlidingWindow(times=3, seconds=60)
    assert w.hit("k", now=0.0) is None
    assert w.hit("k", now=1.0) is None
    assert w.hit("k", now=2.0) is None
    retry = w.hit("k", now=3.0)
    assert retry is not None and retry > 0


def test_sliding_window_frees_up_after_window():
    w = SlidingWindow(times=2, seconds=10)
    assert w.hit("k", now=0.0) is None
    assert w.hit("k", now=1.0) is None
    assert w.hit("k", now=2.0) is not None  # full
    assert w.hit("k", now=11.0) is None  # first event aged out


def test_sliding_window_keys_are_independent():
    w = SlidingWindow(times=1, seconds=60)
    assert w.hit("a", now=0.0) is None
    assert w.hit("b", now=0.0) is None
    assert w.hit("a", now=1.0) is not None


def test_login_returns_429_when_enabled(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    body = {"email": "ratelimit@test.dev", "password": "wrong-password"}
    # login allows 10/min/IP — the 11th call must be limited
    statuses = [client.post("/api/auth/login", json=body).status_code for _ in range(11)]
    assert statuses[-1] == 429
    assert all(s == 401 for s in statuses[:10])


def test_429_carries_retry_after(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    body = {"email": "retryafter@test.dev", "password": "x-not-real"}
    last = None
    for _ in range(11):
        last = client.post("/api/auth/login", json=body)
    assert last is not None and last.status_code == 429
    assert int(last.headers["Retry-After"]) >= 1


def test_register_not_limited_when_disabled(client):
    # conftest disables rate limiting by default; repeated registers hit the
    # normal 409 path, never 429.
    body = {"email": "off@test.dev", "password": "password123"}
    first = client.post("/api/auth/register", json=body)
    assert first.status_code == 201
    for _ in range(6):
        assert client.post("/api/auth/register", json=body).status_code == 409
