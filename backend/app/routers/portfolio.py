import contextlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.crud.portfolio import create_position, delete_position, list_positions
from app.db.session import get_db
from app.models.portfolio import Position
from app.models.user import User
from app.schemas.portfolio import PositionCreate
from app.services.market import get_quote

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


async def _position_dict(db: AsyncSession, p: Position) -> dict:
    current: float | None = None
    with contextlib.suppress(Exception):
        current = (await get_quote(db, p.symbol)).get("price")

    pnl = None
    if current is not None:
        diff = current - p.entry_price
        pnl = round(diff * p.size * (1 if p.side == "LONG" else -1), 2)

    return {
        "id": p.id,
        "symbol": p.symbol,
        "side": p.side,
        "size": p.size,
        "entryPrice": p.entry_price,
        "currentPrice": current,
        "pnl": pnl,
    }


@router.get("")
async def get_portfolio(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    positions = await list_positions(db, current_user.id)
    rows = [await _position_dict(db, p) for p in positions]
    total_pnl = round(sum(r["pnl"] for r in rows if r["pnl"] is not None), 2)
    total_notional = round(sum(p.entry_price * p.size for p in positions), 2)
    winners = sum(1 for r in rows if r["pnl"] is not None and r["pnl"] > 0)
    return {
        "positions": rows,
        "stats": {
            "totalPnl": total_pnl,
            "openCount": len(positions),
            "notional": total_notional,
            "winners": winners,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_position(
    body: PositionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    side = body.side.upper()
    if side not in ("LONG", "SHORT"):
        raise HTTPException(status_code=400, detail="side must be LONG or SHORT")
    position = await create_position(
        db, current_user.id, body.symbol, side, body.size, body.entry_price
    )
    return await _position_dict(db, position)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_position(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_position(db, current_user.id, position_id)
