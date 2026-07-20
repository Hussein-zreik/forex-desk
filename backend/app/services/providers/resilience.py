"""Retry-with-backoff and a per-provider circuit breaker.

A flaky or down upstream shouldn't be retried on every poll cycle — that just
amplifies load and floods the logs. The breaker trips after a run of failures
and short-circuits to the fallback for a cooldown, then probes once.
"""

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from typing import TypeVar

logger = logging.getLogger("app.providers")

T = TypeVar("T")

# Defaults tuned for the ~30 s poll loop: a couple of quick retries for a
# transient blip, then trip after a sustained run of failures.
RETRY_ATTEMPTS = 3
RETRY_BASE_DELAY = 0.2
FAIL_THRESHOLD = 4
RESET_SECONDS = 120.0


async def retry_async(
    factory: Callable[[], Awaitable[T]],
    *,
    attempts: int = RETRY_ATTEMPTS,
    base_delay: float = RETRY_BASE_DELAY,
    do_not_retry: tuple[type[BaseException], ...] = (),
) -> T:
    """Call ``factory`` with exponential backoff, re-raising the last error.

    ``do_not_retry`` exceptions (e.g. UnsupportedSymbol — a deterministic miss)
    propagate immediately without burning attempts.
    """
    last: BaseException | None = None
    for i in range(attempts):
        try:
            return await factory()
        except do_not_retry:
            raise
        except Exception as exc:  # noqa: BLE001 — retry any transient upstream error
            last = exc
            if i == attempts - 1:
                break
            await asyncio.sleep(base_delay * (2**i))
    assert last is not None
    raise last


class CircuitBreaker:
    """Three-state breaker: closed → open (after N fails) → half-open probe."""

    def __init__(
        self,
        name: str,
        *,
        fail_threshold: int = FAIL_THRESHOLD,
        reset_seconds: float = RESET_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.name = name
        self._fail_threshold = fail_threshold
        self._reset_seconds = reset_seconds
        self._clock = clock
        self._failures = 0
        self._opened_at: float | None = None

    @property
    def is_open(self) -> bool:
        return self._opened_at is not None

    def allow(self) -> bool:
        """True if a call may proceed (closed, or a half-open probe is due)."""
        if self._opened_at is None:
            return True
        if self._clock() - self._opened_at >= self._reset_seconds:
            return True  # half-open: let one probe through
        return False

    def record_success(self) -> None:
        if self._opened_at is not None:
            logger.info("circuit %s recovered — closing", self.name)
        self._failures = 0
        self._opened_at = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self._fail_threshold:
            was_open = self._opened_at is not None
            self._opened_at = self._clock()  # (re)start the cooldown
            if not was_open:
                logger.warning(
                    "circuit %s opened after %d failures — using fallback for %.0fs",
                    self.name,
                    self._failures,
                    self._reset_seconds,
                )
