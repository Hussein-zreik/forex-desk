"""Retry-with-backoff + per-provider circuit breaker."""

import asyncio

import pytest

from app.core.config import settings
from app.services import providers
from app.services.providers.base import UnsupportedSymbol
from app.services.providers.resilience import CircuitBreaker, retry_async

# ---------------------------------------------------------------- retry_async


def test_retry_succeeds_after_transient_failures():
    calls = {"n": 0}

    async def flaky():
        calls["n"] += 1
        if calls["n"] < 3:
            raise RuntimeError("blip")
        return "ok"

    result = asyncio.run(retry_async(flaky, attempts=3, base_delay=0))
    assert result == "ok"
    assert calls["n"] == 3


def test_retry_gives_up_and_reraises_last_error():
    calls = {"n": 0}

    async def always_fails():
        calls["n"] += 1
        raise RuntimeError("down")

    with pytest.raises(RuntimeError, match="down"):
        asyncio.run(retry_async(always_fails, attempts=3, base_delay=0))
    assert calls["n"] == 3


def test_retry_does_not_retry_excluded_exceptions():
    calls = {"n": 0}

    async def unsupported():
        calls["n"] += 1
        raise UnsupportedSymbol("nope")

    with pytest.raises(UnsupportedSymbol):
        asyncio.run(
            retry_async(
                unsupported, attempts=3, base_delay=0, do_not_retry=(UnsupportedSymbol,)
            )
        )
    assert calls["n"] == 1  # propagated immediately


# ------------------------------------------------------------- CircuitBreaker


def test_breaker_opens_after_threshold_then_blocks():
    now = {"t": 0.0}
    cb = CircuitBreaker("td", fail_threshold=3, reset_seconds=100, clock=lambda: now["t"])

    assert cb.allow() is True
    for _ in range(3):
        cb.record_failure()
    assert cb.is_open is True
    assert cb.allow() is False  # blocked while cooling down


def test_breaker_half_open_probe_after_reset():
    now = {"t": 0.0}
    cb = CircuitBreaker("td", fail_threshold=2, reset_seconds=100, clock=lambda: now["t"])
    cb.record_failure()
    cb.record_failure()
    assert cb.allow() is False

    now["t"] = 100.0  # cooldown elapsed
    assert cb.allow() is True  # a single probe is permitted
    cb.record_success()  # probe succeeded → closed again
    assert cb.is_open is False
    assert cb.allow() is True


def test_breaker_success_resets_failure_count():
    cb = CircuitBreaker("td", fail_threshold=3)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    cb.record_failure()
    assert cb.is_open is False  # count restarted, nowhere near threshold


# --------------------------------------------------------- dispatch integration


def test_open_circuit_stops_calling_a_dead_provider(monkeypatch):
    """After enough failures the provider is skipped entirely — straight to yahoo."""
    monkeypatch.setattr(settings, "market_provider", "twelvedata")
    monkeypatch.setattr(settings, "twelvedata_api_key", "test-key")
    providers.reset_breakers()

    td_calls = {"n": 0}
    yahoo_calls = {"n": 0}

    async def boom(*a, **k):
        td_calls["n"] += 1
        raise RuntimeError("upstream down")

    async def fake_yahoo_chart(symbol):
        yahoo_calls["n"] += 1
        return {"chart": {"result": [{"meta": {"regularMarketPrice": 1.0, "currency": "USD"}}]}}

    monkeypatch.setattr("app.services.providers.twelvedata._get", boom)
    monkeypatch.setattr("app.services.yahoo.fetch_chart", fake_yahoo_chart)

    async def run():
        # Each dispatch: 3 retries against twelvedata, then yahoo. Breaker trips
        # at FAIL_THRESHOLD (4) dispatches; further calls skip twelvedata.
        for _ in range(8):
            await providers.fetch_chart("EURUSD=X")

    asyncio.run(run())

    assert yahoo_calls["n"] == 8  # every call still served
    # twelvedata stopped being probed once the breaker opened, instead of being
    # hammered 3× on all 8 cycles (which would be 24 calls).
    assert td_calls["n"] < 24
    assert providers._breaker("twelvedata").is_open is True
