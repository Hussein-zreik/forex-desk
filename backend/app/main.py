import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import init_db
from app.realtime.poller import poll_loop
from app.routers import (
    auth,
    bias,
    journal,
    layout,
    market,
    portfolio,
    telegram,
    userdata,
    widgets,
    ws,
)
from app.services import telegram as telegram_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Register the Telegram webhook so /start deep-links reach us. Best-effort,
    # and only outside dev (localhost isn't reachable by Telegram anyway).
    if settings.telegram_bot_token and settings.environment != "dev":
        import contextlib

        with contextlib.suppress(Exception):
            await telegram_service.set_webhook(f"{settings.public_base_url}/api/telegram/webhook")
    poller_task: asyncio.Task | None = None
    if settings.poller_enabled:
        poller_task = asyncio.create_task(poll_loop())
    try:
        yield
    finally:
        if poller_task is not None:
            poller_task.cancel()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market.router)
app.include_router(widgets.router)
app.include_router(layout.router)
app.include_router(userdata.router)
app.include_router(portfolio.router)
app.include_router(journal.router)
app.include_router(telegram.router)
app.include_router(bias.router)
app.include_router(ws.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


# Serve the built single-page app from the same origin as the API, so the whole
# platform runs as one service behind one URL (no separate frontend host, no
# CORS). Enabled only when a build is present (the Docker image copies the
# frontend's `dist` here); local dev keeps using the Vite server untouched.
_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "static"

if (_FRONTEND_DIST / "index.html").is_file():
    _ASSETS = _FRONTEND_DIST / "assets"
    if _ASSETS.is_dir():
        app.mount("/assets", StaticFiles(directory=_ASSETS), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:
        """Return real static files (icons, manifest, sw.js) when they exist,
        otherwise index.html so client-side routes (e.g. /dashboard) resolve."""
        candidate = _FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_DIST / "index.html")
