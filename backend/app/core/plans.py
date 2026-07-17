"""Plan definitions + the single place gates read the current plan from.

Gates enforce only when Stripe is configured: with no upgrade path there must
be no gate, so an unconfigured deploy behaves exactly like before billing
existed (everything unlimited).
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.billing import Subscription

FREE_MAX_ACTIVE_ALERTS = 3
FREE_JOURNAL_WINDOW_DAYS = 90

# Stripe statuses that count as a live pro subscription.
_PRO_STATUSES = {"active", "trialing"}


def billing_configured() -> bool:
    return bool(settings.stripe_secret_key and settings.stripe_price_id_pro)


async def get_plan(db: AsyncSession, user_id: str) -> str:
    """"pro" or "free". Unconfigured billing reads as pro (no gates)."""
    if not billing_configured():
        return "pro"
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = result.scalar_one_or_none()
    if sub is not None and sub.status in _PRO_STATUSES:
        return "pro"
    return "free"
