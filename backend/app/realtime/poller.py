import asyncio
import contextlib

from app.core.config import settings
from app.db.session import SessionLocal
from app.realtime.manager import manager
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


async def poll_loop() -> None:
    """Periodically poll quotes and broadcast them to connected clients."""
    while True:
        await asyncio.sleep(settings.poller_interval_seconds)
        quotes = await poll_once()
        if quotes:
            await manager.broadcast({"type": "quotes", "quotes": quotes})
