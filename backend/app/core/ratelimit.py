"""Per-IP sliding-window rate limiting for sensitive endpoints.

In-memory on purpose: the deploy is a single Render instance running one
uvicorn worker, so a process-local window is exact — no extra writes to the
free-tier Postgres per auth attempt, no GC job, no Redis. Counters reset on
redeploy, which is acceptable for brute-force protection. Revisit (shared
store) if the service ever scales to `numInstances > 1`.
"""

import math
import time
from collections import deque

from fastapi import HTTPException, Request

from app.core.config import settings


class SlidingWindow:
    """Track event timestamps per key; deny once `times` fall inside `seconds`."""

    # Sweep empty/stale keys once the dict grows past this (amortized cleanup).
    _PRUNE_AT = 10_000

    def __init__(self, times: int, seconds: float) -> None:
        self.times = times
        self.seconds = seconds
        self._events: dict[str, deque[float]] = {}

    def hit(self, key: str, now: float | None = None) -> float | None:
        """Record an attempt. Returns None if allowed, else seconds to wait."""
        now = time.monotonic() if now is None else now
        window = self._events.setdefault(key, deque())
        cutoff = now - self.seconds
        while window and window[0] <= cutoff:
            window.popleft()
        if len(window) >= self.times:
            return window[0] + self.seconds - now
        window.append(now)
        if len(self._events) > self._PRUNE_AT:
            self._prune(cutoff)
        return None

    def _prune(self, cutoff: float) -> None:
        for key in [k for k, w in self._events.items() if not w or w[-1] <= cutoff]:
            del self._events[key]


def client_ip(request: Request) -> str:
    """Real client IP: first hop of X-Forwarded-For (Render proxy) or the peer."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(times: int, seconds: float):
    """Dependency factory: allow `times` requests per `seconds` per IP per route."""
    window = SlidingWindow(times, seconds)

    async def dependency(request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        retry_after = window.hit(f"{request.url.path}:{client_ip(request)}")
        if retry_after is not None:
            raise HTTPException(
                status_code=429,
                detail="Too many requests — try again later.",
                headers={"Retry-After": str(max(1, math.ceil(retry_after)))},
            )

    return dependency
