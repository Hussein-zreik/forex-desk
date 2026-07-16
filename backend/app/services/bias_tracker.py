"""Bias track record: snapshot the composite hourly, grade it later.

Runs inside the existing poll loop (no scheduler dependency): once per UTC
hour it (1) snapshots the composite for the tracked symbols, (2) fills in
1-day / 1-week outcomes for snapshots whose horizon has passed, and
(3) prunes rows older than the retention window.
"""

import contextlib
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bias import BiasSnapshot
from app.models.market import QuoteCache
from app.services.bias import SNAPSHOT_SYMBOLS, compute_composite

logger = logging.getLogger("app.bias_tracker")

# Moves smaller than this are graded NEUTRAL — they're noise, not confirmation.
NOISE_FLOOR = 0.0005  # 0.05 %
RETENTION_DAYS = 180


def _bucket(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H")


def _aware(dt: datetime) -> datetime:
    """SQLite hands back naive datetimes; stored values are UTC."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


def grade(score: int, price_at: float, price_later: float) -> str:
    """CORRECT when the score's sign matches the move; small moves are NEUTRAL."""
    if score == 0 or price_at <= 0:
        return "NEUTRAL"
    delta = (price_later - price_at) / price_at
    if abs(delta) < NOISE_FLOOR:
        return "NEUTRAL"
    return "CORRECT" if (score > 0) == (delta > 0) else "WRONG"


async def _cached_price(db: AsyncSession, symbol: str) -> float | None:
    cached = await db.get(QuoteCache, symbol)
    price = cached.payload.get("price") if cached and cached.payload else None
    return float(price) if price is not None else None


async def _take_snapshots(db: AsyncSession, now: datetime) -> None:
    bucket = _bucket(now)
    for symbol in SNAPSHOT_SYMBOLS:
        with contextlib.suppress(Exception):
            exists = await db.execute(
                select(BiasSnapshot.id).where(
                    BiasSnapshot.symbol == symbol, BiasSnapshot.bucket == bucket
                )
            )
            if exists.scalar_one_or_none() is not None:
                continue
            price = await _cached_price(db, symbol)
            if price is None:
                continue
            composite = await compute_composite(db, symbol)
            db.add(
                BiasSnapshot(
                    symbol=symbol,
                    bucket=bucket,
                    taken_at=now,
                    score=composite["score"],
                    label=composite["label"],
                    signals=composite["signals"],
                    price_at=price,
                )
            )
            await db.commit()


async def _evaluate_outcomes(db: AsyncSession, now: datetime) -> None:
    result = await db.execute(
        select(BiasSnapshot).where(
            (BiasSnapshot.outcome_1d.is_(None)) | (BiasSnapshot.outcome_1w.is_(None))
        )
    )
    dirty = False
    for snap in result.scalars():
        age = now - _aware(snap.taken_at)
        price = await _cached_price(db, snap.symbol)
        if price is None:
            continue
        if snap.outcome_1d is None and age >= timedelta(days=1):
            snap.price_1d = price
            snap.outcome_1d = grade(snap.score, snap.price_at, price)
            dirty = True
        if snap.outcome_1w is None and age >= timedelta(weeks=1):
            snap.price_1w = price
            snap.outcome_1w = grade(snap.score, snap.price_at, price)
            dirty = True
    if dirty:
        await db.commit()


async def _prune(db: AsyncSession, now: datetime) -> None:
    cutoff = now - timedelta(days=RETENTION_DAYS)
    result = await db.execute(select(BiasSnapshot.id, BiasSnapshot.taken_at))
    stale = [row.id for row in result if _aware(row.taken_at) < cutoff]
    if not stale:
        return
    for snap_id in stale:
        snapshot = await db.get(BiasSnapshot, snap_id)
        if snapshot is not None:
            await db.delete(snapshot)
    await db.commit()


async def snapshot_tick(db: AsyncSession, now: datetime | None = None) -> None:
    """One hourly pass: snapshot, evaluate due outcomes, prune old rows."""
    now = now or datetime.now(UTC)
    await _take_snapshots(db, now)
    await _evaluate_outcomes(db, now)
    await _prune(db, now)
