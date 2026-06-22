import httpx

# Forex Factory weekly economic calendar (JSON mirror).
FF_JSON = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}


async def fetch_calendar() -> list:
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
        resp = await client.get(FF_JSON)
        resp.raise_for_status()
        return resp.json()


def normalize_calendar(data: list) -> list[dict]:
    events = []
    for e in data:
        events.append(
            {
                "title": e.get("title"),
                "currency": e.get("country"),
                "date": e.get("date"),
                "impact": (e.get("impact") or "").lower(),
                "forecast": e.get("forecast") or "",
                "previous": e.get("previous") or "",
            }
        )
    return events
