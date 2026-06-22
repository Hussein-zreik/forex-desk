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


class PriceAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    condition: str
    level: float
    status: str
