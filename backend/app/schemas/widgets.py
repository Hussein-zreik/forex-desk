from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EcoSurpriseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    currency: str
    beats: int
    misses: int


class EcoAdjust(BaseModel):
    currency: str
    field: str  # beats | misses
    delta: int


class PriceAlertCreate(BaseModel):
    symbol: str
    condition: str  # ABOVE | BELOW
    level: float
    notify_email: bool = False


class PriceAlertUpdate(BaseModel):
    """Lifecycle actions: re-arm a HIT alert and/or mark it seen."""

    status: str | None = None  # only "ACTIVE" (re-arm) is accepted
    seen: bool | None = None
    notify_email: bool | None = None


class PriceAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    condition: str
    level: float
    status: str
    triggered_at: datetime | None = None
    triggered_price: float | None = None
    seen: bool = False
    notify_email: bool = False
