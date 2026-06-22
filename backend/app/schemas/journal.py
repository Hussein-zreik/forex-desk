from pydantic import BaseModel, ConfigDict


class JournalCreate(BaseModel):
    symbol: str
    direction: str  # LONG | SHORT
    pnl: float
    traded_on: str  # YYYY-MM-DD
    session: str = ""
    mistake: str = ""
    notes: str = ""


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
