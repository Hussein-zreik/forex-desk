import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(UTC)


def _uuid() -> str:
    return str(uuid.uuid4())


class BiasSnapshot(Base):
    """Hourly record of the composite bias, later graded against price moves.

    The unique (symbol, bucket) pair IS the dedupe: one row per symbol per
    hour no matter how often the tick runs. Outcomes fill in asynchronously
    once the 1-day / 1-week horizons pass.
    """

    __tablename__ = "bias_snapshot"
    __table_args__ = (UniqueConstraint("symbol", "bucket", name="uq_bias_snapshot_symbol_bucket"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    symbol: Mapped[str] = mapped_column(String, index=True)
    bucket: Mapped[str] = mapped_column(String)  # "YYYY-MM-DDTHH" (UTC hour)
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    score: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String)  # BULLISH | BEARISH | NEUTRAL
    signals: Mapped[list] = mapped_column(JSON, default=list)
    price_at: Mapped[float] = mapped_column(Float)
    price_1d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_1w: Mapped[float | None] = mapped_column(Float, nullable=True)
    outcome_1d: Mapped[str | None] = mapped_column(String, nullable=True)  # CORRECT|WRONG|NEUTRAL
    outcome_1w: Mapped[str | None] = mapped_column(String, nullable=True)
