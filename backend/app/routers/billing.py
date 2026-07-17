from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.plans import FREE_JOURNAL_WINDOW_DAYS, FREE_MAX_ACTIVE_ALERTS, get_plan
from app.db.session import get_db
from app.models.billing import Subscription
from app.models.user import User
from app.services import billing

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/status")
async def status(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    plan = await get_plan(db, current_user.id)
    return {
        "configured": billing.billing_configured(),
        "plan": plan,
        "limits": {
            "max_active_alerts": None if plan == "pro" else FREE_MAX_ACTIVE_ALERTS,
            "journal_window_days": None if plan == "pro" else FREE_JOURNAL_WINDOW_DAYS,
        },
    }


@router.post("/checkout")
async def checkout(current_user: User = Depends(get_current_user)) -> dict:
    if not billing.billing_configured():
        raise HTTPException(status_code=503, detail="Billing is not configured on this server")
    return {"url": await billing.create_checkout_url(current_user)}


@router.post("/portal")
async def portal(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    if not billing.billing_configured():
        raise HTTPException(status_code=503, detail="Billing is not configured on this server")
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if sub is None or not sub.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No subscription on file")
    return {"url": await billing.create_portal_url(sub.stripe_customer_id)}


@router.post("/webhook", include_in_schema=False)
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    signature: str | None = Header(None, alias="Stripe-Signature"),
) -> dict:
    payload = await request.body()
    try:
        event = billing.parse_event(payload, signature or "")
    except Exception as exc:  # bad signature / malformed payload
        raise HTTPException(status_code=400, detail="invalid webhook signature") from exc
    handled = await billing.apply_event(db, event)
    return {"ok": True, "handled": handled}
