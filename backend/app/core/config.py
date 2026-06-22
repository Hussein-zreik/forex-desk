from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Forex Desk API"

    # Dev frontend origins allowed through CORS.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Database (SQLite for dev; swap to Postgres via env in prod).
    database_url: str = "sqlite+aiosqlite:///./forex_desk.db"

    # Auth / JWT
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Live price poller
    poller_enabled: bool = True
    poller_interval_seconds: int = 8

    # Telegram price-alert delivery (optional)
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""


settings = Settings()
