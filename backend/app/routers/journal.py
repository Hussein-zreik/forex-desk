from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.plans import FREE_JOURNAL_WINDOW_DAYS, get_plan
from app.crud.journal import create_entry, delete_entry, list_entries, update_entry
from app.db.session import get_db
from app.models.bias import BiasSnapshot
from app.models.journal import JournalEntry
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalOut, JournalUpdate
from app.services.statement_import import parse_statement

router = APIRouter(prefix="/api/journal", tags=["journal"])

_MAX_STATEMENT_BYTES = 2 * 1024 * 1024


@router.get("", response_model=list[JournalOut])
async def get_entries(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    entries = await list_entries(db, current_user.id)
    # Free plan sees a rolling window (data is kept, not deleted — upgrading
    # restores full history). Enforced only when billing is configured.
    if await get_plan(db, current_user.id) == "free":
        cutoff = (datetime.now(UTC) - timedelta(days=FREE_JOURNAL_WINDOW_DAYS)).strftime(
            "%Y-%m-%d"
        )
        entries = [e for e in entries if e.traded_on >= cutoff]
    return entries


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


@router.post("/import")
async def import_statement(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Import an MT4/MT5 statement (HTML or CSV); dedupes by broker ticket."""
    content = await file.read()
    if len(content) > _MAX_STATEMENT_BYTES:
        raise HTTPException(status_code=413, detail="statement larger than 2 MB")
    try:
        trades, errors = parse_statement(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    existing = await db.execute(
        select(JournalEntry.broker_ticket).where(
            JournalEntry.user_id == current_user.id,
            JournalEntry.broker_ticket.is_not(None),
        )
    )
    known = {t for (t,) in existing.all()}

    imported = 0
    skipped = 0
    for trade in trades:
        if trade["ticket"] in known:
            skipped += 1
            continue
        known.add(trade["ticket"])
        db.add(
            JournalEntry(
                user_id=current_user.id,
                symbol=trade["symbol"],
                direction=trade["direction"],
                pnl=trade["pnl"],
                traded_on=trade["close_date"] or "",
                broker_ticket=trade["ticket"],
            )
        )
        imported += 1
    await db.commit()
    return {"imported": imported, "skipped": skipped, "errors": errors}


@router.get("/bias-alignment")
async def bias_alignment(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trade performance split by agreement with the published bias.

    For each trade, the same-day bias snapshot (latest hour bucket of that
    date) decides WITH / AGAINST; trades on untracked symbols or days without
    a snapshot count as NO_DATA — surfaced honestly while the record warms up.
    """
    entries = await list_entries(db, current_user.id)
    snaps = await db.execute(
        select(BiasSnapshot.symbol, BiasSnapshot.bucket, BiasSnapshot.score).order_by(
            BiasSnapshot.bucket.asc()
        )
    )
    # (symbol, date) → score of the day's last snapshot (ascending order wins).
    day_score: dict[tuple[str, str], int] = {}
    for symbol, bucket, score in snaps.all():
        day_score[(symbol, bucket[:10])] = score

    groups: dict[str, list[float]] = {"with": [], "against": [], "no_data": []}
    for entry in entries:
        score = day_score.get((entry.symbol, entry.traded_on))
        if score is None or score == 0:
            groups["no_data"].append(entry.pnl)
            continue
        bias_long = score > 0
        trade_long = entry.direction == "LONG"
        groups["with" if bias_long == trade_long else "against"].append(entry.pnl)

    def stats(pnls: list[float]) -> dict:
        n = len(pnls)
        wins = sum(1 for p in pnls if p > 0)
        return {
            "n": n,
            "win_rate": round(wins / n * 100, 1) if n else None,
            "avg_pnl": round(sum(pnls) / n, 2) if n else None,
        }

    return {key: stats(pnls) for key, pnls in groups.items()}
