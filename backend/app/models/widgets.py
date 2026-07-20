import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
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
    # Lifecycle: when/where it fired, whether the owner saw it in the UI, and
    # whether the owner also wants email delivery (Telegram is the default DM).
    triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    triggered_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    seen: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_email: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class AlertHit(Base):
    """An immutable record of a price alert firing.

    Written on every trigger (kept even if the alert is later re-armed or
    deleted) so the user has a durable log to learn from. `alert_id` is stored
    without an FK so history survives the parent alert's deletion.
    """

    __tablename__ = "alert_hit"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    alert_id: Mapped[str | None] = mapped_column(String, nullable=True)
    symbol: Mapped[str] = mapped_column(String)
    condition: Mapped[str] = mapped_column(String)
    level: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float)
    fired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
