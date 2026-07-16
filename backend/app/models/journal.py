import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(UTC)


def _uuid() -> str:
    return str(uuid.uuid4())


class JournalEntry(Base):
    """A logged (closed) trade for journaling + analytics."""

    __tablename__ = "journal_entry"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    symbol: Mapped[str] = mapped_column(String)
    direction: Mapped[str] = mapped_column(String)  # LONG | SHORT
    pnl: Mapped[float] = mapped_column(Float)
    traded_on: Mapped[str] = mapped_column(String)  # YYYY-MM-DD
    session: Mapped[str] = mapped_column(String, default="")
    mistake: Mapped[str] = mapped_column(String, default="")
    notes: Mapped[str] = mapped_column(String, default="")
    # Free-form labels, stored normalized: lowercase, comma-separated, deduped.
    tags: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
