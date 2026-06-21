from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(UTC)


class DashboardLayout(Base):
    """Per-user dashboard: react-grid-layout positions + the widget instances."""

    __tablename__ = "dashboard_layout"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), primary_key=True)
    layouts: Mapped[dict] = mapped_column(JSON, default=dict)
    widgets: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
