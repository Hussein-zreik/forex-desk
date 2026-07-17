"""Stripe wrapper — checkout, portal, and webhook-driven subscription state.

The stripe SDK is synchronous, so network calls run in a thread. The webhook
(signature-verified) is the only writer of subscription rows: client requests
can start a checkout but never set their own plan.
"""

from asyncio import to_thread
from datetime import UTC, datetime

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.plans import billing_configured
from app.models.billing import Subscription
from app.models.user import User

_PRO_STATUSES = {"active", "trialing"}


def _client() -> None:
    stripe.api_key = settings.stripe_secret_key


async def create_checkout_url(user: User) -> str:
    _client()
    session = await to_thread(
        stripe.checkout.Session.create,
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id_pro, "quantity": 1}],
        client_reference_id=user.id,
        customer_email=user.email,
        success_url=f"{settings.public_base_url}/pricing?upgraded=1",
        cancel_url=f"{settings.public_base_url}/pricing",
    )
    return session.url


async def create_portal_url(customer_id: str) -> str:
    _client()
    session = await to_thread(
        stripe.billing_portal.Session.create,
        customer=customer_id,
        return_url=f"{settings.public_base_url}/pricing",
    )
    return session.url


def parse_event(payload: bytes, signature: str) -> stripe.Event:
    """Verify + parse a webhook payload; raises on a bad signature."""
    return stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)


async def _get_or_create(db: AsyncSession, user_id: str) -> Subscription:
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(user_id=user_id)
        db.add(sub)
    return sub


async def _find_by_subscription_id(db: AsyncSession, sub_id: str) -> Subscription | None:
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == sub_id)
    )
    return result.scalar_one_or_none()


def _period_end(obj: dict) -> datetime | None:
    ts = obj.get("current_period_end")
    return datetime.fromtimestamp(ts, tz=UTC) if ts else None


async def apply_event(db: AsyncSession, event: stripe.Event) -> bool:
    """Upsert subscription state from a Stripe event. Returns True if handled."""
    kind = event["type"]
    obj = event["data"]["object"]

    if kind == "checkout.session.completed":
        user_id = obj.get("client_reference_id")
        if not user_id:
            return False
        sub = await _get_or_create(db, user_id)
        sub.stripe_customer_id = obj.get("customer")
        sub.stripe_subscription_id = obj.get("subscription")
        sub.plan = "pro"
        sub.status = "active"
        await db.commit()
        return True

    if kind in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub = await _find_by_subscription_id(db, obj.get("id", ""))
        if sub is None:
            return False
        status = "canceled" if kind.endswith("deleted") else obj.get("status", "canceled")
        sub.status = status
        sub.plan = "pro" if status in _PRO_STATUSES else "free"
        sub.current_period_end = _period_end(obj)
        await db.commit()
        return True

    return False


__all__ = [
    "apply_event",
    "billing_configured",
    "create_checkout_url",
    "create_portal_url",
    "parse_event",
]
