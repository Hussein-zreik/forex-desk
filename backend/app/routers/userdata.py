from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.crud.widgets import (
    adjust_eco_surprise,
    create_alert,
    delete_alert,
    get_eco_surprises,
    list_alerts,
    update_alert,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.widgets import (
    EcoAdjust,
    EcoSurpriseOut,
    PriceAlertCreate,
    PriceAlertOut,
    PriceAlertUpdate,
)

router = APIRouter(prefix="/api", tags=["userdata"])


@router.get("/eco-surprises", response_model=list[EcoSurpriseOut])
async def eco_get(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await get_eco_surprises(db, current_user.id)


@router.post("/eco-surprises", response_model=EcoSurpriseOut)
async def eco_adjust(
    body: EcoAdjust,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.field not in ("beats", "misses"):
        raise HTTPException(status_code=400, detail="field must be beats or misses")
    return await adjust_eco_surprise(db, current_user.id, body.currency, body.field, body.delta)


@router.get("/alerts", response_model=list[PriceAlertOut])
async def alerts_list(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await list_alerts(db, current_user.id)


@router.post("/alerts", response_model=PriceAlertOut, status_code=status.HTTP_201_CREATED)
async def alerts_create(
    body: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    condition = body.condition.upper()
    if condition not in ("ABOVE", "BELOW"):
        raise HTTPException(status_code=400, detail="condition must be ABOVE or BELOW")
    return await create_alert(
        db, current_user.id, body.symbol, condition, body.level, body.notify_email
    )


@router.patch("/alerts/{alert_id}", response_model=PriceAlertOut)
async def alerts_update(
    alert_id: str,
    body: PriceAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.status is not None and body.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="status may only be set to ACTIVE (re-arm)")
    alert = await update_alert(
        db,
        current_user.id,
        alert_id,
        status=body.status,
        seen=body.seen,
        notify_email=body.notify_email,
    )
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def alerts_delete(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_alert(db, current_user.id, alert_id)
