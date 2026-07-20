from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.symbols import DEFAULT_WATCHLIST, MAX_WATCHLIST_SYMBOLS, SUPPORTED_SYMBOLS
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class CatalogEntry(BaseModel):
    symbol: str
    label: str


class WatchlistOut(BaseModel):
    symbols: list[str]
    catalog: list[CatalogEntry]


class WatchlistIn(BaseModel):
    symbols: list[str]


def _catalog() -> list[CatalogEntry]:
    return [CatalogEntry(symbol=s, label=label) for s, label in SUPPORTED_SYMBOLS.items()]


def user_watchlist(user: User) -> list[str]:
    """The user's effective watchlist (custom order preserved, default if unset)."""
    if not user.watchlist:
        return list(DEFAULT_WATCHLIST)
    symbols = [s for s in user.watchlist.split(",") if s in SUPPORTED_SYMBOLS]
    return symbols or list(DEFAULT_WATCHLIST)


@router.get("", response_model=WatchlistOut)
async def get_watchlist(current_user: User = Depends(get_current_user)) -> WatchlistOut:
    return WatchlistOut(symbols=user_watchlist(current_user), catalog=_catalog())


@router.put("", response_model=WatchlistOut)
async def put_watchlist(
    body: WatchlistIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WatchlistOut:
    seen: set[str] = set()
    symbols: list[str] = []
    for s in body.symbols:
        if s not in SUPPORTED_SYMBOLS:
            raise HTTPException(status_code=400, detail=f"Unsupported symbol: {s}")
        if s not in seen:
            seen.add(s)
            symbols.append(s)
    if not symbols:
        raise HTTPException(status_code=400, detail="Watchlist cannot be empty")
    if len(symbols) > MAX_WATCHLIST_SYMBOLS:
        raise HTTPException(
            status_code=400, detail=f"Watchlist is capped at {MAX_WATCHLIST_SYMBOLS} symbols"
        )
    current_user.watchlist = ",".join(symbols)
    await db.commit()
    return WatchlistOut(symbols=symbols, catalog=_catalog())
