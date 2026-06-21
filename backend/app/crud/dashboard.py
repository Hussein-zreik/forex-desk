from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import DashboardLayout


async def get_layout(db: AsyncSession, user_id: str) -> DashboardLayout | None:
    return await db.get(DashboardLayout, user_id)


async def upsert_layout(
    db: AsyncSession,
    user_id: str,
    layouts: dict[str, Any],
    widgets: list[dict[str, Any]],
) -> DashboardLayout:
    row = await db.get(DashboardLayout, user_id)
    if row is not None:
        row.layouts = layouts
        row.widgets = widgets
    else:
        row = DashboardLayout(user_id=user_id, layouts=layouts, widgets=widgets)
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
