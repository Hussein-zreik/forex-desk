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
