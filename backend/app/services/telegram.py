import hashlib
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("app.telegram")

_API = "https://api.telegram.org/bot{token}/{method}"

# getMe result cached for the process lifetime (the bot's username is stable).
_bot_username: str | None = None


def webhook_secret() -> str:
    """Shared secret Telegram echoes back on every webhook call.

    Derived from the JWT secret so no extra env var is needed; hex output
    satisfies Telegram's allowed charset (A-Za-z0-9_-, 1-256 chars).
    """
    return hashlib.sha256(f"{settings.jwt_secret}:telegram-webhook".encode()).hexdigest()


async def _call(method: str, payload: dict) -> dict | None:
    if not settings.telegram_bot_token:
        return None
    url = _API.format(token=settings.telegram_bot_token, method=method)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            return data if data.get("ok") else None
    except (httpx.HTTPError, ValueError):
        logger.warning("telegram %s call failed", method)
        return None


async def send_message(text: str, chat_id: str | None = None) -> bool:
    """DM a specific chat; falls back to the legacy global chat when none given."""
    target = chat_id or settings.telegram_chat_id
    if not settings.telegram_bot_token or not target:
        return False
    return await _call("sendMessage", {"chat_id": target, "text": text}) is not None


async def get_bot_username() -> str | None:
    """The bot's @username (cached), needed to build t.me deep links."""
    global _bot_username
    if _bot_username:
        return _bot_username
    data = await _call("getMe", {})
    if data:
        _bot_username = data.get("result", {}).get("username")
    return _bot_username


async def set_webhook(url: str) -> bool:
    """Point Telegram's webhook at us (idempotent; called from app startup)."""
    return (
        await _call(
            "setWebhook",
            {
                "url": url,
                "secret_token": webhook_secret(),
                "allowed_updates": ["message"],
            },
        )
        is not None
    )
