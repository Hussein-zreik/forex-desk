import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcrypt has a hard 72-byte limit on the input; truncate defensively.
_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:_MAX_BYTES], bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode()[:_MAX_BYTES], hashed.encode())


def create_access_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str | None:
    """Return the token subject (user id), or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    # Scoped tokens (e.g. the TOTP challenge) are not access tokens.
    if payload.get("scope") is not None:
        return None
    return payload.get("sub")


# TOTP login challenge: a short-lived scoped JWT proving the password step
# passed, exchangeable only at /auth/totp/verify.
_CHALLENGE_TTL_MINUTES = 5


def create_challenge_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=_CHALLENGE_TTL_MINUTES)
    payload = {"sub": subject, "exp": expire, "scope": "totp"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_challenge_token(token: str) -> str | None:
    """Return the subject of a TOTP challenge token, or None for anything else."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    if payload.get("scope") != "totp":
        return None
    return payload.get("sub")


def generate_one_time_token() -> tuple[str, str]:
    """A single-use token: (raw value for the link, sha256 hex to store).

    sha256 (not bcrypt) so the stored digest can be looked up by value —
    the raw token already carries 256 bits of entropy, so no salt is needed.
    """
    raw = secrets.token_urlsafe(32)
    return raw, hash_one_time_token(raw)


def hash_one_time_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
