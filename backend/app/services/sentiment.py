import httpx

FNG_URL = "https://api.alternative.me/fng/"


async def fetch_fear_greed() -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(FNG_URL, params={"limit": 35})
        resp.raise_for_status()
        return resp.json()


def normalize_fear_greed(data: dict) -> dict:
    items = data.get("data", [])
    history = [
        {
            "value": int(d["value"]),
            "timestamp": int(d["timestamp"]),
            "classification": d.get("value_classification"),
        }
        for d in items
    ]
    latest = history[0] if history else None
    return {"latest": latest, "history": list(reversed(history))}


# --- Retail positioning (contrarian) --------------------------------------
# Community-outlook style source: long/short % of retail accounts per pair.
# Configure RETAIL_URL to a provider (e.g. a Myfxbook community-outlook export);
# the parser accepts that shape. Our symbols map to the provider's pair names.
RETAIL_URL = "https://www.myfxbook.com/api/get-community-outlook.json"

RETAIL_NAMES: dict[str, str] = {
    "EURUSD=X": "EURUSD",
    "GBPUSD=X": "GBPUSD",
    "USDJPY=X": "USDJPY",
    "AUDUSD=X": "AUDUSD",
    "USDCAD=X": "USDCAD",
    "USDCHF=X": "USDCHF",
    "NZDUSD=X": "NZDUSD",
    "XAU=F": "XAUUSD",
}

RETAIL_SYMBOLS = list(RETAIL_NAMES)


async def fetch_retail() -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(RETAIL_URL)
        resp.raise_for_status()
        return resp.json()


def parse_retail(data: dict, name: str) -> dict | None:
    """Extract one pair's long/short % from a community-outlook payload."""
    rows = data.get("symbols")
    if isinstance(rows, dict):  # some payloads nest under symbols.symbols
        rows = rows.get("symbols")
    if not isinstance(rows, list):
        rows = []
    for row in rows:
        if str(row.get("name", "")).upper() != name.upper():
            continue
        long_pct = row.get("longPercentage")
        short_pct = row.get("shortPercentage")
        if long_pct is None and short_pct is None:
            return None
        long_pct = float(long_pct) if long_pct is not None else 100 - float(short_pct)
        short_pct = float(short_pct) if short_pct is not None else 100 - long_pct
        return {
            "longPct": round(long_pct, 1),
            "shortPct": round(short_pct, 1),
            # Contrarian read: a heavily one-sided retail book leans the other way.
            "contrarian": "bearish" if long_pct >= 60 else "bullish" if short_pct >= 60 else "neutral",
        }
    return None
