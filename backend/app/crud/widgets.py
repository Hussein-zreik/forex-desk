from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.widgets import EcoSurprise, PriceAlert

CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"]


async def get_eco_surprises(db: AsyncSession, user_id: str) -> list[EcoSurprise]:
    result = await db.execute(select(EcoSurprise).where(EcoSurprise.user_id == user_id))
    existing = {r.currency: r for r in result.scalars()}
    return [
        existing.get(c) or EcoSurprise(user_id=user_id, currency=c, beats=0, misses=0)
        for c in CURRENCIES
    ]


async def adjust_eco_surprise(
    db: AsyncSession, user_id: str, currency: str, field: str, delta: int
) -> EcoSurprise:
    row = await db.get(EcoSurprise, (user_id, currency))
    if row is None:
        row = EcoSurprise(user_id=user_id, currency=currency, beats=0, misses=0)
        db.add(row)
    if field == "beats":
        row.beats = max(0, row.beats + delta)
    else:
        row.misses = max(0, row.misses + delta)
    await db.commit()
    await db.refresh(row)
    return row


async def list_alerts(db: AsyncSession, user_id: str) -> list[PriceAlert]:
    result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == user_id)
        .order_by(PriceAlert.created_at.desc())
    )
    return list(result.scalars())


async def create_alert(
    db: AsyncSession,
    user_id: str,
    symbol: str,
    condition: str,
    level: float,
    notify_email: bool = False,
) -> PriceAlert:
    alert = PriceAlert(
        user_id=user_id,
        symbol=symbol,
        condition=condition,
        level=level,
        notify_email=notify_email,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def update_alert(
    db: AsyncSession,
    user_id: str,
    alert_id: str,
    *,
    status: str | None = None,
    seen: bool | None = None,
    notify_email: bool | None = None,
) -> PriceAlert | None:
    alert = await db.get(PriceAlert, alert_id)
    if alert is None or alert.user_id != user_id:
        return None
    if status == "ACTIVE":  # re-arm a fired alert
        alert.status = "ACTIVE"
        alert.triggered_at = None
        alert.triggered_price = None
        alert.seen = False
    if seen is not None:
        alert.seen = seen
    if notify_email is not None:
        alert.notify_email = notify_email
    await db.commit()
    await db.refresh(alert)
    return alert


async def delete_alert(db: AsyncSession, user_id: str, alert_id: str) -> bool:
    alert = await db.get(PriceAlert, alert_id)
    if alert is not None and alert.user_id == user_id:
        await db.delete(alert)
        await db.commit()
        return True
    return False
