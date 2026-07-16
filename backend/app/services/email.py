"""Outbound email with pluggable, zero-cost providers.

Mirrors the shape of `services/telegram.py`: a single `send_email` that
returns False instead of raising when delivery isn't possible, so callers
degrade gracefully. Providers:

- ``console`` (default): log the message — dev-friendly, lets the full
  reset/verify flows run locally with no account anywhere.
- ``smtp``: stdlib client (any free SMTP relay), run in a thread so the
  async loop never blocks.
- ``resend``: one HTTPS call to the Resend API (free tier).
"""

import logging
import smtplib
from asyncio import to_thread
from email.mime.text import MIMEText

import httpx

from app.core.config import settings

logger = logging.getLogger("app.email")

RESEND_URL = "https://api.resend.com/emails"


def is_configured() -> bool:
    """True when real delivery (not just console logging) is available."""
    if settings.email_provider == "smtp":
        return bool(settings.smtp_host)
    if settings.email_provider == "resend":
        return bool(settings.resend_api_key)
    return False


def _send_smtp(to: str, subject: str, html: str) -> None:
    msg = MIMEText(html, "html")
    msg["Subject"] = subject
    msg["From"] = settings.email_from
    msg["To"] = to
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


async def send_email(to: str, subject: str, html: str) -> bool:
    """Deliver an email via the configured provider; False on any failure."""
    provider = settings.email_provider
    try:
        if provider == "smtp" and settings.smtp_host:
            await to_thread(_send_smtp, to, subject, html)
            return True
        if provider == "resend" and settings.resend_api_key:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    RESEND_URL,
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": settings.email_from,
                        "to": [to],
                        "subject": subject,
                        "html": html,
                    },
                )
                resp.raise_for_status()
            return True
        # Console fallback — never a real delivery, but the flow stays testable.
        logger.info("email (console) to=%s subject=%r\n%s", to, subject, html)
        return provider == "console"
    except (httpx.HTTPError, OSError, smtplib.SMTPException):
        logger.warning("email delivery failed (provider=%s, to=%s)", provider, to)
        return False
