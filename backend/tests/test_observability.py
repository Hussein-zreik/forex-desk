from app.core.observability import init_sentry


def test_sentry_noop_without_dsn(client):
    """Default config: no DSN → no init, and the app booted fine (fixture)."""
    assert init_sentry() is False


def test_sentry_initializes_with_dsn(monkeypatch):
    from app.core.config import settings

    captured: dict = {}

    def fake_init(**kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(settings, "sentry_dsn", "https://key@o0.ingest.sentry.io/0")
    monkeypatch.setattr("sentry_sdk.init", fake_init)
    assert init_sentry() is True
    assert captured["dsn"].startswith("https://key@")
    assert captured["send_default_pii"] is False
