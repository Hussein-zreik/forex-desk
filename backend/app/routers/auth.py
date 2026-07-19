from datetime import UTC, datetime, timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.ratelimit import rate_limit
from app.core.security import (
    create_access_token,
    create_challenge_token,
    decode_challenge_token,
    hash_password,
    verify_password,
)
from app.crud.token import consume_token, issue_token
from app.crud.user import create_user, get_user_by_email, get_user_by_id
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthConfigOut,
    ForgotPasswordIn,
    LoginOut,
    ResetPasswordIn,
    Token,
    TotpCodeIn,
    TotpSetupOut,
    TotpVerifyIn,
    UserCreate,
    UserLogin,
    UserOut,
    VerifyEmailIn,
)
from app.services import email as email_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

_RESET_TTL = timedelta(hours=1)
_VERIFY_TTL = timedelta(hours=24)


async def _send_verification(db: AsyncSession, user: User) -> None:
    raw = await issue_token(db, user.id, "verify", _VERIFY_TTL)
    link = f"{settings.public_base_url}/verify-email?token={raw}"
    await email_service.send_email(
        user.email,
        "Verify your Forex Desk email",
        f'<p>Welcome to Forex Desk!</p><p><a href="{link}">Verify your email</a> '
        f"(link valid for 24 hours).</p>",
    )


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(times=5, seconds=3600))],
)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> Token:
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await create_user(db, data.email, hash_password(data.password))
    await _send_verification(db, user)
    return Token(access_token=create_access_token(user.id))


@router.post(
    "/login",
    response_model=LoginOut,
    response_model_exclude_none=True,
    dependencies=[Depends(rate_limit(times=10, seconds=60))],
)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)) -> LoginOut:
    user = await get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.totp_enabled:
        return LoginOut(totp_required=True, challenge_token=create_challenge_token(user.id))
    return LoginOut(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/config", response_model=AuthConfigOut)
async def auth_config() -> AuthConfigOut:
    return AuthConfigOut(email_configured=email_service.is_configured())


@router.post(
    "/forgot-password",
    dependencies=[Depends(rate_limit(times=3, seconds=3600))],
)
async def forgot_password(data: ForgotPasswordIn, db: AsyncSession = Depends(get_db)) -> dict:
    """Always 200, whether or not the account exists (no user enumeration)."""
    user = await get_user_by_email(db, data.email)
    if user:
        raw = await issue_token(db, user.id, "reset", _RESET_TTL)
        link = f"{settings.public_base_url}/reset-password?token={raw}"
        await email_service.send_email(
            user.email,
            "Reset your Forex Desk password",
            f'<p><a href="{link}">Reset your password</a> (link valid for 1 hour). '
            f"If you didn't request this, you can ignore it.</p>",
        )
    return {"ok": True}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordIn, db: AsyncSession = Depends(get_db)) -> dict:
    user_id = await consume_token(db, data.token, "reset")
    user = await get_user_by_id(db, user_id) if user_id else None
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user.hashed_password = hash_password(data.new_password)
    await db.commit()
    return {"ok": True}


@router.post("/verify-email")
async def verify_email(data: VerifyEmailIn, db: AsyncSession = Depends(get_db)) -> dict:
    user_id = await consume_token(db, data.token, "verify")
    user = await get_user_by_id(db, user_id) if user_id else None
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    user.email_verified_at = datetime.now(UTC)
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------- TOTP 2FA

_TOTP_WINDOW = 1  # accept the neighbouring 30 s steps (clock skew)


def _verify_totp(user: User, code: str) -> bool:
    if not user.totp_secret:
        return False
    cleaned = code.strip().replace(" ", "")
    return pyotp.TOTP(user.totp_secret).verify(cleaned, valid_window=_TOTP_WINDOW)


@router.post("/totp/setup", response_model=TotpSetupOut)
async def totp_setup(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> TotpSetupOut:
    """Issue a fresh secret; 2FA only turns on once a code confirms it at /totp/enable."""
    if current_user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="2FA is already enabled")
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    current_user.totp_enabled_at = None
    await db.commit()
    url = pyotp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Forex Desk")
    return TotpSetupOut(secret=secret, otpauth_url=url)


@router.post("/totp/enable")
async def totp_enable(
    data: TotpCodeIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if current_user.totp_enabled:
        return {"ok": True, "already_enabled": True}
    if not _verify_totp(current_user, data.code):
        raise HTTPException(status_code=400, detail="That code didn't match — try the current one")
    current_user.totp_enabled_at = datetime.now(UTC)
    await db.commit()
    return {"ok": True}


@router.post("/totp/disable")
async def totp_disable(
    data: TotpCodeIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not current_user.totp_enabled:
        return {"ok": True}
    if not _verify_totp(current_user, data.code):
        raise HTTPException(status_code=400, detail="That code didn't match — try the current one")
    current_user.totp_secret = None
    current_user.totp_enabled_at = None
    current_user.totp_last_counter = None
    await db.commit()
    return {"ok": True}


@router.post(
    "/totp/verify",
    response_model=Token,
    dependencies=[Depends(rate_limit(times=10, seconds=60))],
)
async def totp_verify(data: TotpVerifyIn, db: AsyncSession = Depends(get_db)) -> Token:
    """Second login step: exchange challenge token + authenticator code for a bearer token."""
    user_id = decode_challenge_token(data.challenge_token)
    user = await get_user_by_id(db, user_id) if user_id else None
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid challenge")
    if not _verify_totp(user, data.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid code")
    # One login per code: refuse anything at or before the last consumed 30 s step.
    counter = int(datetime.now(UTC).timestamp()) // 30
    if user.totp_last_counter is not None and counter <= user.totp_last_counter + _TOTP_WINDOW:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Code already used")
    user.totp_last_counter = counter
    await db.commit()
    return Token(access_token=create_access_token(user.id))


@router.post(
    "/resend-verification",
    dependencies=[Depends(rate_limit(times=3, seconds=3600))],
)
async def resend_verification(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    if current_user.email_verified:
        return {"ok": True, "already_verified": True}
    await _send_verification(db, current_user)
    return {"ok": True}
