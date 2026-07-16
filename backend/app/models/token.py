import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(UTC)


def _uuid() -> str:
    return str(uuid.uuid4())


class OneTimeToken(Base):
    """Single-use, expiring token (password reset, email verification, …).

    Only the sha256 of the raw token is stored; the raw value lives solely in
    the link we email/DM the user. `used_at` makes consumption one-shot.
    """

    __tablename__ = "one_time_token"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    purpose: Mapped[str] = mapped_column(String)  # reset | verify (PR 4 adds telegram)
    token_hash: Mapped[str] = mapped_column(String, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
