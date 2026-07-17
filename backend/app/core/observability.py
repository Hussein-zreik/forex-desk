"""Error tracking — Sentry, strictly opt-in via SENTRY_DSN.

Kept in its own module so the gating is unit-testable and `main.py` stays
declarative. With no DSN configured this is a no-op: the app must boot and
pass CI with zero paid/external services set up.
"""

import logging

from app.core.config import settings

logger = logging.getLogger("app.observability")


def init_sentry() -> bool:
    """Initialize Sentry when a DSN is configured. Returns True if enabled."""
    if not settings.sentry_dsn:
        return False
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        # Errors are the point; keep performance tracing cheap.
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    logger.info("sentry enabled (environment=%s)", settings.environment)
    return True
