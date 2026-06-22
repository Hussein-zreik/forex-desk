import httpx

RSS2JSON = "https://api.rss2json.com/v1/api.json"

GOLD_FEEDS = [
    "https://www.kitco.com/rss/kitco-news.rss",
    "https://www.fxstreet.com/markets/commodities/metals/gold/rss",
    "https://www.investing.com/rss/commodities_Gold.rss",
]

_POSITIVE = {
    "surge",
    "rally",
    "gains",
    "jumps",
    "rises",
    "soars",
    "boost",
    "strong",
    "beats",
    "bullish",
    "record",
    "high",
    "climb",
    "support",
    "demand",
}
_NEGATIVE = {
    "falls",
    "drops",
    "plunge",
    "sinks",
    "slump",
    "weak",
    "misses",
    "bearish",
    "fears",
    "crash",
    "tumble",
    "selloff",
    "pressure",
    "decline",
    "loss",
}


async def fetch_feed(url: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(RSS2JSON, params={"rss_url": url, "count": 12})
        resp.raise_for_status()
        return resp.json()


def classify(title: str) -> str:
    words = set(title.lower().replace(",", " ").split())
    pos = len(words & _POSITIVE)
    neg = len(words & _NEGATIVE)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def normalize_news(data: dict, limit: int = 6) -> list[dict]:
    source = (data.get("feed") or {}).get("title")
    items = (data.get("items") or [])[:limit]
    return [
        {
            "title": i.get("title", ""),
            "link": i.get("link", ""),
            "pubDate": i.get("pubDate"),
            "source": source,
            "sentiment": classify(i.get("title", "")),
        }
        for i in items
    ]
