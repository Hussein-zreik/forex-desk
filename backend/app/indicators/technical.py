def pivot_points(high: float, low: float, close: float) -> dict:
    """Classic floor-trader pivots from a session's high/low/close."""
    pp = (high + low + close) / 3
    return {
        "pp": pp,
        "r1": 2 * pp - low,
        "r2": pp + (high - low),
        "r3": high + 2 * (pp - low),
        "s1": 2 * pp - high,
        "s2": pp - (high - low),
        "s3": low - 2 * (high - pp),
    }


def atr(candles: list[dict], period: int = 14) -> float | None:
    """Average True Range over the last `period` candles."""
    if len(candles) < period + 1:
        return None
    trs: list[float] = []
    for i in range(1, len(candles)):
        prev_close = candles[i - 1]["c"]
        high = candles[i]["h"]
        low = candles[i]["l"]
        trs.append(max(high - low, abs(high - prev_close), abs(low - prev_close)))
    return sum(trs[-period:]) / period


def key_levels(candles: list[dict], price: float, lookback: int = 3, count: int = 3) -> dict:
    """Detect swing-high resistances above price and swing-low supports below."""
    resistance: set[float] = set()
    support: set[float] = set()
    n = len(candles)
    for i in range(lookback, n - lookback):
        window = range(i - lookback, i + lookback + 1)
        high = candles[i]["h"]
        low = candles[i]["l"]
        if all(high >= candles[j]["h"] for j in window) and high > price:
            resistance.add(round(high, 2))
        if all(low <= candles[j]["l"] for j in window) and low < price:
            support.add(round(low, 2))
    return {
        "resistance": sorted(resistance)[:count],
        "support": sorted(support, reverse=True)[:count],
    }


def returns(closes: list[float]) -> list[float]:
    """Period-over-period simple returns."""
    return [closes[i] / closes[i - 1] - 1 for i in range(1, len(closes)) if closes[i - 1]]


def pearson(a: list[float], b: list[float]) -> float | None:
    """Pearson correlation over the overlapping tail of two series."""
    n = min(len(a), len(b))
    if n < 2:
        return None
    a, b = a[-n:], b[-n:]
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((x - mb) ** 2 for x in b)
    if va == 0 or vb == 0:
        return None
    return cov / (va**0.5 * vb**0.5)
