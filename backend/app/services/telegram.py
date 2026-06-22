import httpx

from app.core.config import settings


async def send_message(text: str) -> bool:
    """Send a Telegram message if a bot token + chat id are configured."""
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return False
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json={"chat_id": settings.telegram_chat_id, "text": text})
    except httpx.HTTPError:
        return False
    return True
