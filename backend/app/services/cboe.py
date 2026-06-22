import csv
import io

import httpx

# CBOE daily market statistics — total options put/call ratio (a classic
# sentiment gauge). The CSV mirror exposes a date + put/call-ratio series.
CBOE_CSV = "https://cdn.cboe.com/api/global/us_indices/daily_prices/put_call_ratio.csv"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}


async def fetch_putcall() -> str:
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(CBOE_CSV)
        resp.raise_for_status()
        return resp.text


def parse_putcall(text: str) -> list[dict]:
    """Parse a CBOE CSV into [{date, ratio}].

    Robust to layout: prefers a column whose header mentions the ratio,
    otherwise derives puts/calls from those columns.
    """
    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        return []
    header = [h.strip().lower() for h in rows[0]]

    ratio_idx = next(
        (i for i, h in enumerate(header) if "ratio" in h or "p/c" in h or "put/call" in h),
        None,
    )
    calls_idx = next((i for i, h in enumerate(header) if h == "calls" or "call" in h), None)
    puts_idx = next((i for i, h in enumerate(header) if h == "puts" or "put" in h), None)

    out: list[dict] = []
    for row in rows[1:]:
        if not row:
            continue
        date = row[0]
        try:
            if ratio_idx is not None and len(row) > ratio_idx:
                ratio = float(row[ratio_idx])
            elif calls_idx is not None and puts_idx is not None:
                calls = float(row[calls_idx])
                puts = float(row[puts_idx])
                if not calls:
                    continue
                ratio = puts / calls
            else:
                continue
            out.append({"date": date, "ratio": round(ratio, 3)})
        except (ValueError, IndexError, ZeroDivisionError):
            continue
    return out


def classify(ratio: float) -> str:
    """Map a put/call ratio to a sentiment label (more puts ⇒ fear)."""
    if ratio >= 1.0:
        return "Fear"
    if ratio <= 0.7:
        return "Greed"
    return "Neutral"
