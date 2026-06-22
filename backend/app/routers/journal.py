from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.crud.journal import create_entry, delete_entry, list_entries
from app.db.session import get_db
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalOut

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("", response_model=list[JournalOut])
async def get_entries(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await list_entries(db, current_user.id)


@router.post("", response_model=JournalOut, status_code=status.HTTP_201_CREATED)
async def add_entry(
    body: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    direction = body.direction.upper()
    if direction not in ("LONG", "SHORT"):
        raise HTTPException(status_code=400, detail="direction must be LONG or SHORT")
    data = body.model_dump()
    data["direction"] = direction
    return await create_entry(db, current_user.id, data)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_entry(db, current_user.id, entry_id)
