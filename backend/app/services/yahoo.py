import httpx

CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}


async def fetch_chart(symbol: str) -> dict:
    """Fetch the raw Yahoo Finance chart payload for a symbol."""
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(CHART_URL.format(symbol=symbol))
        resp.raise_for_status()
        return resp.json()


def normalize_quote(symbol: str, data: dict) -> dict:
    """Reduce a Yahoo chart payload to a compact quote."""
    meta = data["chart"]["result"][0]["meta"]
    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")

    change = price - prev if price is not None and prev else None
    change_pct = (change / prev * 100) if change is not None and prev else None

    return {
        "symbol": symbol,
        "price": price,
        "previousClose": prev,
        "change": change,
        "changePercent": change_pct,
        "currency": meta.get("currency"),
        "marketTime": meta.get("regularMarketTime"),
    }
