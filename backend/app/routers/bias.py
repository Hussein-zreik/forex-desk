"""Bias track record: persisted snapshot history + honest hit-rate stats.

Public like the rest of the widget API — the track record is a product
feature, not user data.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.bias import BiasSnapshot

router = APIRouter(prefix="/api/bias", tags=["bias"])

# Cap the series payload: at most ~4 points/day regardless of range.
_MAX_POINTS = 120


@router.get("/history")
async def history(
    symbol: str = Query("XAU=F"),
    days: int = Query(30, ge=1, le=180),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(BiasSnapshot)
        .where(BiasSnapshot.symbol == symbol)
        .order_by(BiasSnapshot.bucket.desc())
        .limit(days * 24)
    )
    rows = list(result.scalars())[::-1]  # oldest → newest
    step = max(1, len(rows) // _MAX_POINTS)
    sampled = rows[::step]
    return {
        "symbol": symbol,
        "points": [
            {
                "bucket": s.bucket,
                "score": s.score,
                "label": s.label,
                "price": s.price_at,
                "outcome_1d": s.outcome_1d,
                "outcome_1w": s.outcome_1w,
            }
            for s in sampled
        ],
    }


@router.get("/stats")
async def stats(symbol: str = Query("XAU=F"), db: AsyncSession = Depends(get_db)) -> dict:
    """Hit-rate per horizon. NEUTRAL grades are excluded — they're non-calls."""
    result = await db.execute(
        select(BiasSnapshot.outcome_1d, BiasSnapshot.outcome_1w).where(
            BiasSnapshot.symbol == symbol
        )
    )
    rows = result.all()

    def horizon(outcomes: list[str | None]) -> dict:
        correct = sum(1 for o in outcomes if o == "CORRECT")
        wrong = sum(1 for o in outcomes if o == "WRONG")
        graded = correct + wrong
        return {
            "correct": correct,
            "wrong": wrong,
            "n": graded,
            "hit_rate": round(correct / graded * 100, 1) if graded else None,
        }

    return {
        "symbol": symbol,
        "snapshots": len(rows),
        "h1d": horizon([r.outcome_1d for r in rows]),
        "h1w": horizon([r.outcome_1w for r in rows]),
    }
