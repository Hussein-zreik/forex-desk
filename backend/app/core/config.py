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

    # Telegram price-alert delivery (optional)
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

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
