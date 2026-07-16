from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_one_time_token, hash_one_time_token
from app.models.token import OneTimeToken


async def issue_token(
    db: AsyncSession, user_id: str, purpose: str, ttl: timedelta
) -> str:
    """Create a fresh single-use token, invalidating prior unused ones.

    Invalidation keeps exactly one live link per purpose (the newest email
    wins), which also caps the damage of a leaked older link.
    """
    now = datetime.now(UTC)
    await db.execute(
        update(OneTimeToken)
        .where(
            OneTimeToken.user_id == user_id,
            OneTimeToken.purpose == purpose,
            OneTimeToken.used_at.is_(None),
        )
        .values(used_at=now)
    )
    raw, token_hash = generate_one_time_token()
    db.add(
        OneTimeToken(
            user_id=user_id, purpose=purpose, token_hash=token_hash, expires_at=now + ttl
        )
    )
    await db.commit()
    return raw


async def consume_token(db: AsyncSession, raw: str, purpose: str) -> str | None:
    """Validate and burn a token; returns the owning user id or None."""
    result = await db.execute(
        select(OneTimeToken).where(
            OneTimeToken.token_hash == hash_one_time_token(raw),
            OneTimeToken.purpose == purpose,
        )
    )
    token = result.scalar_one_or_none()
    now = datetime.now(UTC)
    if token is None or token.used_at is not None:
        return None
    expires = token.expires_at
    # SQLite returns naive datetimes; treat stored times as UTC.
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if expires <= now:
        return None
    token.used_at = now
    await db.commit()
    return token.user_id
