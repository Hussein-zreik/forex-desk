import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.realtime.poller import poll_loop
from app.routers import auth, layout, market, widgets, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
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
app.include_router(ws.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
