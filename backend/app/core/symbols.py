"""Curated symbol catalog users can watch and alert on.

Everything here is served by the market-data providers (Yahoo symbols; the
Twelve Data adapter maps them). Kept server-side so the watchlist endpoint can
validate input instead of letting arbitrary strings hit upstream APIs.
"""

SUPPORTED_SYMBOLS: dict[str, str] = {
    # Metals
    "XAU=F": "XAU/USD",
    "XAG=F": "XAG/USD",
    "GC=F": "Gold Fut",
    "SI=F": "Silver Fut",
    # FX majors
    "EURUSD=X": "EUR/USD",
    "GBPUSD=X": "GBP/USD",
    "USDJPY=X": "USD/JPY",
    "USDCHF=X": "USD/CHF",
    "AUDUSD=X": "AUD/USD",
    "USDCAD=X": "USD/CAD",
    "NZDUSD=X": "NZD/USD",
    # FX crosses
    "EURGBP=X": "EUR/GBP",
    "EURJPY=X": "EUR/JPY",
    "GBPJPY=X": "GBP/JPY",
    "AUDJPY=X": "AUD/JPY",
    "EURCHF=X": "EUR/CHF",
    # Dollar index
    "DX-Y.NYB": "DXY",
    # Energy
    "CL=F": "WTI Oil",
    "BZ=F": "Brent Oil",
    "NG=F": "Nat Gas",
    # Indices
    "^GSPC": "S&P 500",
    "^NDX": "Nasdaq 100",
    "^DJI": "Dow Jones",
    "^FTSE": "FTSE 100",
    "^GDAXI": "DAX 40",
    "^N225": "Nikkei 225",
    # Rates
    "^TNX": "US 10Y Yield",
    # Crypto
    "BTC-USD": "BTC/USD",
    "ETH-USD": "ETH/USD",
}

# Default watchlist for users who never customized (mirrors the live ticker).
DEFAULT_WATCHLIST = [
    "XAU=F",
    "XAG=F",
    "EURUSD=X",
    "GBPUSD=X",
    "USDJPY=X",
    "USDCHF=X",
    "AUDUSD=X",
    "USDCAD=X",
    "DX-Y.NYB",
    "BTC-USD",
    "GC=F",
    "CL=F",
    "^GSPC",
]

MAX_WATCHLIST_SYMBOLS = 30
