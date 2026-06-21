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
