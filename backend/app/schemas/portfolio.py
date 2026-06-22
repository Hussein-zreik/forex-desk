from pydantic import BaseModel


class PositionCreate(BaseModel):
    symbol: str
    side: str  # LONG | SHORT
    size: float
    entry_price: float
