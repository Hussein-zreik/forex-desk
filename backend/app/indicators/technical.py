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
