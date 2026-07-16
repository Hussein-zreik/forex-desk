from pydantic import BaseModel, ConfigDict, field_validator


def normalize_tags(raw: str) -> str:
    """Lowercase, trim, dedupe (order-preserving) a comma-separated tag list."""
    seen: list[str] = []
    for part in raw.split(","):
        tag = part.strip().lower()
        if tag and tag not in seen:
            seen.append(tag)
    return ",".join(seen)


class JournalCreate(BaseModel):
    symbol: str
    direction: str  # LONG | SHORT
    pnl: float
    traded_on: str  # YYYY-MM-DD
    session: str = ""
    mistake: str = ""
    notes: str = ""
    tags: str = ""

    @field_validator("tags")
    @classmethod
    def _tags(cls, v: str) -> str:
        return normalize_tags(v)


class JournalUpdate(BaseModel):
    """Partial edit — only provided fields change."""

    symbol: str | None = None
    direction: str | None = None
    pnl: float | None = None
    traded_on: str | None = None
    session: str | None = None
    mistake: str | None = None
    notes: str | None = None
    tags: str | None = None

    @field_validator("tags")
    @classmethod
    def _tags(cls, v: str | None) -> str | None:
        return normalize_tags(v) if v is not None else None


class JournalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    direction: str
    pnl: float
    traded_on: str
    session: str
    mistake: str
    notes: str
    tags: str = ""
