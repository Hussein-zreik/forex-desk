import asyncio
import contextlib

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.market import QuoteCache
from app.models.widgets import PriceAlert
from app.realtime.manager import manager
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


async def check_alerts() -> None:
    """Mark active alerts HIT when their level is crossed; notify via Telegram."""
    async with SessionLocal() as db:
        result = await db.execute(select(PriceAlert).where(PriceAlert.status == "ACTIVE"))
        triggered = False
        for alert in result.scalars():
            cached = await db.get(QuoteCache, alert.symbol)
            price = cached.payload.get("price") if cached and cached.payload else None
            if price is None:
                continue
            if alert_hit(alert.condition, alert.level, price):
                alert.status = "HIT"
                triggered = True
                await telegram.send_message(
                    f"\U0001f514 {alert.symbol} {alert.condition} {alert.level} hit at {price}"
                )
        if triggered:
            await db.commit()


async def poll_loop() -> None:
    """Periodically poll quotes, broadcast them, and check price alerts."""
    while True:
        await asyncio.sleep(settings.poller_interval_seconds)
        quotes = await poll_once()
        if quotes:
            await manager.broadcast({"type": "quotes", "quotes": quotes})
        with contextlib.suppress(Exception):
            await check_alerts()
