import httpx

RSS2JSON = "https://api.rss2json.com/v1/api.json"

GOLD_FEEDS = [
    "https://www.kitco.com/rss/kitco-news.rss",
    "https://www.fxstreet.com/markets/commodities/metals/gold/rss",
    "https://www.investing.com/rss/commodities_Gold.rss",
]

# General FX desk feeds — the staples a forex trader keeps open.
FX_FEEDS = [
    "https://www.forexlive.com/feed/news",
    "https://www.fxstreet.com/rss/news",
    "https://www.dailyfx.com/feeds/market-news",
    "https://www.financialjuice.com/feed.ashx?xy=rss",
    "https://www.investing.com/rss/news_1.rss",
]

FEED_SETS = {"gold": GOLD_FEEDS, "fx": FX_FEEDS}

# Keyword → currency code, for tagging headlines by what they move.
_CCY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "USD": ("dollar", "usd", "greenback", "fed", "fomc", "powell"),
    "EUR": ("euro", "eur", "ecb", "lagarde", "eurozone"),
    "GBP": ("pound", "sterling", "gbp", "cable", "boe"),
    "JPY": ("yen", "jpy", "boj", "ueda"),
    "CHF": ("franc", "chf", "snb"),
    "AUD": ("aussie", "aud", "rba"),
    "CAD": ("loonie", "cad", "boc"),
    "NZD": ("kiwi", "nzd", "rbnz"),
    "XAU": ("gold", "xau", "bullion"),
}


def tag_currencies(title: str) -> list[str]:
    """Currencies a headline references, e.g. ['USD', 'EUR']."""
    text = f" {title.lower().replace(',', ' ').replace('.', ' ')} "
    return [ccy for ccy, words in _CCY_KEYWORDS.items() if any(f" {w} " in text for w in words)]

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
            "tags": tag_currencies(i.get("title", "")),
        }
        for i in items
    ]


def aggregate(feeds: list[dict], limit: int = 12) -> list[dict]:
    """Merge several normalized feeds: dedupe by title, newest-ish first."""
    seen: set[str] = set()
    out: list[dict] = []
    for data in feeds:
        for article in normalize_news(data, limit=limit):
            key = article["title"].strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(article)
    return out[:limit]
