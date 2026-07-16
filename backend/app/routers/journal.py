from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.crud.journal import create_entry, delete_entry, list_entries, update_entry
from app.db.session import get_db
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalOut, JournalUpdate

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


@router.patch("/{entry_id}", response_model=JournalOut)
async def edit_entry(
    entry_id: str,
    body: JournalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    changes = body.model_dump(exclude_unset=True)
    if "direction" in changes:
        changes["direction"] = changes["direction"].upper()
        if changes["direction"] not in ("LONG", "SHORT"):
            raise HTTPException(status_code=400, detail="direction must be LONG or SHORT")
    entry = await update_entry(db, current_user.id, entry_id, changes)
    if entry is None:
        raise HTTPException(status_code=404, detail="entry not found")
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_entry(db, current_user.id, entry_id)
