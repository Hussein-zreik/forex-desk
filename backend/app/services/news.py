import xml.etree.ElementTree as ET

import httpx

# Browser-ish UA: some publisher feeds reject the default httpx agent.
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ForexDesk/1.0)"}

GOLD_FEEDS = [
    "https://www.kitco.com/rss/kitco-news.rss",
    "https://www.fxstreet.com/markets/commodities/metals/gold/rss",
    "https://www.investing.com/rss/commodities_Gold.rss",
    "https://www.dailyfx.com/feeds/gold",
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


_ATOM = "{http://www.w3.org/2005/Atom}"


def parse_feed(xml_text: str) -> dict:
    """Parse an RSS 2.0 or Atom document into our internal feed shape.

    Returns ``{"feed": {"title": ...}, "items": [{title, link, pubDate}, ...]}``
    so it stays drop-in compatible with ``normalize_news`` / ``aggregate``.
    """
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ValueError(f"invalid feed XML: {exc}") from exc

    # RSS 2.0: <rss><channel><item>…  (also covers RDF/RSS 1.0 channels)
    channel = root.find("channel")
    if channel is not None:
        items = [
            {
                "title": (it.findtext("title") or "").strip(),
                "link": (it.findtext("link") or "").strip(),
                "pubDate": it.findtext("pubDate"),
            }
            for it in channel.findall("item")
        ]
        return {"feed": {"title": channel.findtext("title")}, "items": items}

    # Atom: <feed><entry>… (link is an attribute, not text).
    items = []
    for entry in root.findall(f"{_ATOM}entry"):
        link_el = entry.find(f"{_ATOM}link")
        items.append(
            {
                "title": (entry.findtext(f"{_ATOM}title") or "").strip(),
                "link": (link_el.get("href") if link_el is not None else "") or "",
                "pubDate": entry.findtext(f"{_ATOM}updated")
                or entry.findtext(f"{_ATOM}published"),
            }
        )
    return {"feed": {"title": root.findtext(f"{_ATOM}title")}, "items": items}


async def fetch_feed(url: str) -> dict:
    """Fetch a publisher's RSS/Atom feed directly and parse it.

    The backend has no CORS constraint, so we read the feed straight from the
    source rather than via a third-party JSON relay (which was rate-limited and
    increasingly key-gated, leaving the news widgets "unavailable").
    """
    async with httpx.AsyncClient(timeout=10, headers=_HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return parse_feed(resp.text)


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
