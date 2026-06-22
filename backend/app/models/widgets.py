import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(UTC)


def _uuid() -> str:
    return str(uuid.uuid4())


class EcoSurprise(Base):
    """Per-user, per-currency economic beat/miss tally."""

    __tablename__ = "eco_surprise"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), primary_key=True)
    currency: Mapped[str] = mapped_column(String, primary_key=True)
    beats: Mapped[int] = mapped_column(Integer, default=0)
    misses: Mapped[int] = mapped_column(Integer, default=0)


class PriceAlert(Base):
    """Per-user price alert; fires once when the level is crossed."""

    __tablename__ = "price_alert"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    symbol: Mapped[str] = mapped_column(String)
    condition: Mapped[str] = mapped_column(String)  # ABOVE | BELOW
    level: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String, default="ACTIVE")  # ACTIVE | HIT
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
