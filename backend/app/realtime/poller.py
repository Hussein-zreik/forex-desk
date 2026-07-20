import asyncio
import contextlib
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.market import QuoteCache
from app.models.user import User
from app.models.widgets import PriceAlert
from app.realtime.manager import manager
from app.services import email as email_service
from app.services import telegram
from app.services.market import get_quote

# Symbols streamed to the live ticker.
TICKER_SYMBOLS = [
    "XAU=F",
    "XAG=F",
    "EURUSD=X",
    "GBPUSD=X",
    "USDJPY=X",
    "USDCHF=X",
    "AUDUSD=X",
    "USDCAD=X",
    "DX-Y.NYB",
    "BTC-USD",
    "GC=F",
    "CL=F",
    "^GSPC",
]


async def poll_once() -> list[dict]:
    """Fetch all ticker symbols once and return their quotes."""
    quotes: list[dict] = []
    async with SessionLocal() as db:
        for symbol in TICKER_SYMBOLS:
            with contextlib.suppress(Exception):
                quotes.append(await get_quote(db, symbol))
    return quotes


def alert_hit(condition: str, level: float, price: float) -> bool:
    return (condition == "ABOVE" and price >= level) or (condition == "BELOW" and price <= level)


async def _notify_owner(db, alert: PriceAlert, price: float) -> None:
    """Deliver a fired alert to its owner (Telegram DM, optional email)."""
    text = f"\U0001f514 {alert.symbol} {alert.condition} {alert.level} hit at {price}"
    owner = await db.get(User, alert.user_id)
    chat_id = owner.telegram_chat_id if owner else None
    # DM the owner's linked chat; the global chat remains only as a legacy
    # fallback for single-user deployments that predate per-user linking.
    await telegram.send_message(text, chat_id=chat_id)
    if alert.notify_email and owner and owner.email_verified:
        await email_service.send_email(
            owner.email,
            f"Price alert: {alert.symbol} {alert.condition} {alert.level}",
            f"<p>{text}</p>",
        )


async def check_alerts() -> None:
    """Mark active alerts HIT when their level is crossed; notify the owner."""
    async with SessionLocal() as db:
        result = await db.execute(select(PriceAlert).where(PriceAlert.status == "ACTIVE"))
        hits: list[dict] = []
        for alert in result.scalars():
            cached = await db.get(QuoteCache, alert.symbol)
            price = cached.payload.get("price") if cached and cached.payload else None
            if price is None:
                # Watchlist symbols outside the streamed core set: fetch on
                # demand (get_quote caches, so upstream sees one call per TTL).
                with contextlib.suppress(Exception):
                    quote = await get_quote(db, alert.symbol)
                    price = quote.get("price")
            if price is None:
                continue
            if alert_hit(alert.condition, alert.level, price):
                alert.status = "HIT"
                alert.triggered_at = datetime.now(UTC)
                alert.triggered_price = price
                alert.seen = False
                await _notify_owner(db, alert, price)
                hits.append(
                    {
                        "id": alert.id,
                        "symbol": alert.symbol,
                        "condition": alert.condition,
                        "level": alert.level,
                        "price": price,
                    }
                )
        if hits:
            await db.commit()
            # Live UI update for anyone connected — widgets refresh immediately
            # instead of waiting for their next poll.
            await manager.broadcast({"type": "alert_hit", "alerts": hits})


_last_snapshot_bucket: str | None = None


async def _maybe_snapshot() -> None:
    """Once per UTC hour: record bias snapshots + grade due outcomes."""
    global _last_snapshot_bucket
    from app.services.bias_tracker import snapshot_tick

    bucket = datetime.now(UTC).strftime("%Y-%m-%dT%H")
    if bucket == _last_snapshot_bucket:
        return
    _last_snapshot_bucket = bucket
    async with SessionLocal() as db:
        await snapshot_tick(db)


async def poll_loop() -> None:
    """Periodically poll quotes, broadcast them, and check price alerts."""
    while True:
        await asyncio.sleep(settings.poller_interval_seconds)
        quotes = await poll_once()
        if quotes:
            await manager.broadcast({"type": "quotes", "quotes": quotes})
        with contextlib.suppress(Exception):
            await check_alerts()
        with contextlib.suppress(Exception):
            await _maybe_snapshot()
