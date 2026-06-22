def smc(candles: list[dict]) -> dict:
    """Lightweight Smart-Money-Concepts read: structure, swing levels, FVG."""
    if len(candles) < 6:
        return {}
    recent = candles[-30:]
    price = recent[-1]["c"]
    prior = recent[:-1]
    swing_high = max(c["h"] for c in prior)
    swing_low = min(c["l"] for c in prior)

    if price > swing_high:
        structure = "BOS ↑"
    elif price < swing_low:
        structure = "BOS ↓"
    else:
        structure = "Ranging"

    # Most recent fair-value gap (3-candle imbalance).
    fvg = None
    for i in range(len(recent) - 2, 0, -1):
        prev_h = recent[i - 1]["h"]
        prev_l = recent[i - 1]["l"]
        next_h = recent[i + 1]["h"]
        next_l = recent[i + 1]["l"]
        if prev_h < next_l:
            fvg = {"type": "bullish", "from": round(prev_h, 2), "to": round(next_l, 2)}
            break
        if prev_l > next_h:
            fvg = {"type": "bearish", "from": round(next_h, 2), "to": round(prev_l, 2)}
            break

    return {
        "structure": structure,
        "price": price,
        "swingHigh": round(swing_high, 2),
        "swingLow": round(swing_low, 2),
        "fvg": fvg,
    }
