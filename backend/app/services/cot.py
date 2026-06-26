import httpx

# CFTC Commitments of Traders — Legacy "Futures Only" report via the public
# Socrata API. We read non-commercial (large speculator) positioning, the
# standard FX/gold positioning gauge, published weekly (Fridays).
COT_API = "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}

# Map our trading symbols to CFTC market_and_exchange_names.
SYMBOL_MARKETS: dict[str, str] = {
    "EURUSD=X": "EURO FX - CHICAGO MERCANTILE EXCHANGE",
    "GBPUSD=X": "BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE",
    "USDJPY=X": "JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE",
    "AUDUSD=X": "AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE",
    "USDCAD=X": "CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE",
    "USDCHF=X": "SWISS FRANC - CHICAGO MERCANTILE EXCHANGE",
    "NZDUSD=X": "NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE",
    "XAU=F": "GOLD - COMMODITY EXCHANGE INC.",
}

COT_SYMBOLS = list(SYMBOL_MARKETS)


async def fetch_cot(market: str) -> list[dict]:
    """Latest two weekly rows for a CFTC market (newest first)."""
    params = {
        "market_and_exchange_names": market,
        "$order": "report_date_as_yyyy_mm_dd DESC",
        "$limit": "2",
        "$select": (
            "report_date_as_yyyy_mm_dd,"
            "noncomm_positions_long_all,noncomm_positions_short_all"
        ),
    }
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(COT_API, params=params)
        resp.raise_for_status()
        return resp.json()


def parse_cot(rows: list[dict]) -> dict | None:
    """Reduce CFTC rows to net speculative positioning + weekly change."""
    if not rows:
        return None

    def net(row: dict) -> tuple[int, int, int]:
        longs = int(float(row["noncomm_positions_long_all"]))
        shorts = int(float(row["noncomm_positions_short_all"]))
        return longs, shorts, longs - shorts

    longs, shorts, latest_net = net(rows[0])
    change = None
    if len(rows) > 1:
        try:
            change = latest_net - net(rows[1])[2]
        except (KeyError, ValueError, TypeError):
            change = None
    total = longs + shorts
    return {
        "date": rows[0].get("report_date_as_yyyy_mm_dd", "")[:10],
        "longs": longs,
        "shorts": shorts,
        "net": latest_net,
        "change": change,
        "longPct": round(longs / total * 100, 1) if total else None,
    }
