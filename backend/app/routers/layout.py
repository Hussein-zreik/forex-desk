from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.crud.dashboard import get_layout, upsert_layout
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import LayoutData

router = APIRouter(prefix="/api/layout", tags=["layout"])


@router.get("", response_model=LayoutData)
async def read_layout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LayoutData:
    row = await get_layout(db, current_user.id)
    if row is None:
        return LayoutData()
    return LayoutData(layouts=row.layouts, widgets=row.widgets)


@router.put("", response_model=LayoutData)
async def write_layout(
    data: LayoutData,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LayoutData:
    row = await upsert_layout(db, current_user.id, data.layouts, data.widgets)
    return LayoutData(layouts=row.layouts, widgets=row.widgets)
