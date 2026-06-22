import csv
import io

import httpx

FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv"


async def fetch_series(series_id: str) -> str:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(FRED_CSV, params={"id": series_id})
        resp.raise_for_status()
        return resp.text


def parse_series(text: str) -> list[dict]:
    """Parse a FRED CSV into [{date, value}], skipping missing ('.') points."""
    rows = list(csv.reader(io.StringIO(text)))
    out: list[dict] = []
    for row in rows[1:]:  # skip header
        if len(row) < 2:
            continue
        date, value = row[0], row[1]
        if value in (".", "", None):
            continue
        try:
            out.append({"date": date, "value": float(value)})
        except ValueError:
            continue
    return out
