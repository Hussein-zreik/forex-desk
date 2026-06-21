def rsi(closes: list[float], period: int = 14) -> float | None:
    if len(closes) < period + 1:
        return None
    diffs = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    recent = diffs[-period:]
    avg_gain = sum(d for d in recent if d > 0) / period
    avg_loss = sum(-d for d in recent if d < 0) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def sma(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def composite_bias(closes: list[float]) -> dict:
    """Blend RSI, MA cross, and price-vs-MA into a -100..100 directional score."""
    if len(closes) < 2:
        return {"score": 0.0, "label": "NEUTRAL", "components": {}}

    r = rsi(closes)
    s20 = sma(closes, 20)
    s50 = sma(closes, 50)
    price = closes[-1]

    score = 0.0
    components: dict = {}

    if r is not None:
        components["rsi"] = round(r, 1)
        score += r - 50

    if s20 is not None and s50 is not None:
        components["maCross"] = "bull" if s20 > s50 else "bear"
        score += 20 if s20 > s50 else -20

    if s20 is not None:
        components["priceVsMa"] = "above" if price > s20 else "below"
        score += 15 if price > s20 else -15

    score = max(-100.0, min(100.0, score))
    label = "BULLISH" if score > 20 else "BEARISH" if score < -20 else "NEUTRAL"
    return {"score": round(score, 1), "label": label, "components": components}
