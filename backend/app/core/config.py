from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_JWT_SECRET = "dev-secret-change-me"


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Forex Desk API"

    # Deployment environment; anything other than "dev" requires a real JWT secret.
    environment: str = "dev"

    # Dev frontend origins allowed through CORS.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Database (SQLite for dev; swap to Postgres via env in prod).
    database_url: str = "sqlite+aiosqlite:///./forex_desk.db"

    # Auth / JWT
    jwt_secret: str = _DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Live price poller
    poller_enabled: bool = True
    poller_interval_seconds: int = 8

    # Per-IP rate limiting on the auth endpoints (tests disable via env).
    rate_limit_enabled: bool = True

    # Market-data source: "yahoo" (default) or "twelvedata" (licensed; needs
    # an API key). Unsupported symbols/errors fall back to yahoo per symbol.
    market_provider: str = "yahoo"
    twelvedata_api_key: str = ""

    # Error tracking (optional) — Sentry activates only when a DSN is set.
    sentry_dsn: str = ""

    # Billing (optional) — plan gates enforce only when Stripe is configured;
    # without keys every feature stays unlimited (no upgrade path = no gate).
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id_pro: str = ""

    # Telegram price-alert delivery (optional)
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Public URL of the deployed app (no trailing slash) — used to build links
    # in outbound email (password reset / verification).
    public_base_url: str = "http://localhost:5173"

    # Outbound email. "console" logs the message (dev default, $0);
    # "smtp" uses the stdlib client; "resend" posts to the Resend API
    # (free tier). Features degrade gracefully when unconfigured.
    email_provider: str = "console"
    email_from: str = "Forex Desk <onboarding@resend.dev>"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    resend_api_key: str = ""

    @model_validator(mode="after")
    def _require_real_secret_outside_dev(self) -> "Settings":
        # Refuse to run with the committed default secret in any non-dev env,
        # so a misconfigured deploy can't ship forgeable tokens.
        if self.environment != "dev" and self.jwt_secret == _DEFAULT_JWT_SECRET:
            raise ValueError(
                "JWT_SECRET must be set to a non-default value when ENVIRONMENT is not 'dev'"
            )
        return self


settings = Settings()
