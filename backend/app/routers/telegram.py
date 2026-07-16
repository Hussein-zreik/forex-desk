"""Per-user Telegram linking: deep-link handshake + webhook receiver.

Flow: the app asks for a link → we mint a 15-minute one-time token and hand
back `https://t.me/<bot>?start=<token>`. The user taps it, Telegram sends the
bot `/start <token>` through the webhook, we resolve the token to the user and
store their chat id. Alerts then DM that chat directly.
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.crud.token import consume_token, issue_token
from app.crud.user import get_user_by_id
from app.db.session import get_db
from app.models.user import User
from app.services import telegram

router = APIRouter(prefix="/api/telegram", tags=["telegram"])

_LINK_TTL = timedelta(minutes=15)


@router.get("/status")
async def status(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "configured": bool(settings.telegram_bot_token),
        "linked": bool(current_user.telegram_chat_id),
    }


@router.post("/link")
async def create_link(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=503, detail="Telegram is not configured on this server")
    username = await telegram.get_bot_username()
    if not username:
        raise HTTPException(status_code=503, detail="Telegram bot unreachable")
    raw = await issue_token(db, current_user.id, "telegram", _LINK_TTL)
    return {"link": f"https://t.me/{username}?start={raw}"}


@router.delete("/link")
async def remove_link(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    current_user.telegram_chat_id = None
    await db.commit()
    return {"ok": True}


@router.post("/webhook", include_in_schema=False)
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    secret: str | None = Header(None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict:
    if secret != telegram.webhook_secret():
        raise HTTPException(status_code=403, detail="bad secret")
    update = await request.json()
    message = update.get("message") or {}
    text: str = message.get("text") or ""
    chat_id = (message.get("chat") or {}).get("id")
    # Always 200 below this point — Telegram retries non-2xx forever.
    if chat_id is None or not text.startswith("/start"):
        return {"ok": True}
    parts = text.split(maxsplit=1)
    token = parts[1].strip() if len(parts) == 2 else ""
    user_id = await consume_token(db, token, "telegram") if token else None
    user = await get_user_by_id(db, user_id) if user_id else None
    if user is None:
        await telegram.send_message(
            "This link is invalid or expired — generate a fresh one from the "
            "Forex Desk alerts widget.",
            chat_id=str(chat_id),
        )
        return {"ok": True}
    user.telegram_chat_id = str(chat_id)
    await db.commit()
    await telegram.send_message(
        f"Linked ✔ Price alerts for {user.email} will arrive here.", chat_id=str(chat_id)
    )
    return {"ok": True}
