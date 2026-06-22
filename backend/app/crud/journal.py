from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.journal import JournalEntry


async def list_entries(db: AsyncSession, user_id: str) -> list[JournalEntry]:
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.traded_on.asc())
    )
    return list(result.scalars())


async def create_entry(db: AsyncSession, user_id: str, data: dict) -> JournalEntry:
    entry = JournalEntry(user_id=user_id, **data)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_entry(db: AsyncSession, user_id: str, entry_id: str) -> bool:
    entry = await db.get(JournalEntry, entry_id)
    if entry is not None and entry.user_id == user_id:
        await db.delete(entry)
        await db.commit()
        return True
    return False
