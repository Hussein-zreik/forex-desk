from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position


async def list_positions(db: AsyncSession, user_id: str) -> list[Position]:
    result = await db.execute(
        select(Position).where(Position.user_id == user_id).order_by(Position.opened_at.desc())
    )
    return list(result.scalars())


async def create_position(
    db: AsyncSession, user_id: str, symbol: str, side: str, size: float, entry_price: float
) -> Position:
    position = Position(
        user_id=user_id, symbol=symbol, side=side, size=size, entry_price=entry_price
    )
    db.add(position)
    await db.commit()
    await db.refresh(position)
    return position


async def delete_position(db: AsyncSession, user_id: str, position_id: str) -> bool:
    position = await db.get(Position, position_id)
    if position is not None and position.user_id == user_id:
        await db.delete(position)
        await db.commit()
        return True
    return False
