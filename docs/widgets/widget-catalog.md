# Widget Catalog — Forex Desk

> Authoritative list of all widgets, provided by the user. ~38 dashboard widgets +
> journal widgets (39–49) + portfolio widgets (50). Each entry: Role · Description · Info · Source.

---

## Data Sources & Infrastructure (synthesized)

**Primary feed:** Yahoo Finance `query1.finance.yahoo.com/v8/finance/chart/{symbol}` — price + OHLC for the large majority of widgets.

**CORS proxies (no traditional backend):**
- **Own Cloudflare Worker** → `forex-desk-proxy.zreik111.workers.dev` (Yahoo Finance, Coinbase)
- `api.codetabs.com/v1/proxy/` (CBOE HTML scrape)
- `api.rss2json.com/v1/api.json?rss_url=` (RSS → JSON for news)

**External APIs:**
| Source | Endpoint | Used by |
|--------|----------|---------|
| Yahoo Finance | `query1.finance.yahoo.com/v8/finance/chart/{symbol}` (via CF Worker) | most price/OHLC widgets |
| FRED (Fed) | `fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10` | Real Yield, Macro Regime |
| Alternative.me | `api.alternative.me/fng/?limit=35` | Fear & Greed |
| CBOE | `cboe.com/us/options/market_statistics/daily/` (scrape via codetabs) | Options Sentiment |
| RSS2JSON | `api.rss2json.com/v1/api.json` ← Kitco, FXStreet, Investing, DailyFX | Gold News, News Sentiment |
| MyFxBook | `myfxbook.com/api/get-economic-calendar.json` | Economic Calendar, Event Countdown, CB Calendar |
| Babypips | `babypips.com/economic-calendar` (scrape, fallback) | Economic Calendar fallback |
| Forex Factory | `nfs.faireconomy.media/ff_calendar_thisweek.xml` (XML, fallback) | Economic Calendar fallback |
| Telegram | `api.telegram.org/bot{TOKEN}/sendMessage` | Price Alerts delivery |
| Coinbase | `api.coinbase.com` (via CF Worker; UI credits CoinGecko) | Crypto Prices |
| TradingView | `tradingview.com/widgetembed/` (sandboxed iframe) | Live Chart |

**Symbols seen:** XAU/USD, XAG/USD, EUR/USD (EURUSD=X), GBP/USD, USD/JPY, USDCHF, AUDUSD, USDCAD, DXY (DX-Y.NYB), VIX (^VIX), BTC/USD, GC=F, CL=F, ^GSPC, XAU=F, XAG=F, GLD, IAU.

**localStorage keys:** `fxdesk_eco_surprises_v1`, `fxdesk_journal_v1`, `fxdesk_portfolio_v1` (+ widget layout via react-grid-layout).

**Client-side computed** (from Yahoo OHLC): RSI, MA cross, ATR/volatility range, pivots, correlation matrix, currency strength, SMC (order blocks / FVG / BOS / CHoCH), MTF confluence/bias, round-number levels, key/swing levels, Hi-Lo breakout, spread.

**Hardcoded static datasets (no API):** Gold Seasonality, Session Heatmap, Rate Differential, CB Calendar (partial).

> ⚠️ **Architecture implication:** This is overwhelmingly a **client-side PWA + CORS proxies + localStorage** design. No SQL DB or Python backend is required by these widgets. **Where TS/SQL/Python fit (declared earlier) is now the key open question** — hypotheses (UNCONFIRMED): the CF Worker proxy (Python Workers? Cloudflare D1 for SQL caching?), or offline data-pipeline scripts that generate the static datasets (seasonality, heatmap). Park for the brainstorm.

---

## Dashboard Widgets

**1. Live Price Ticker** — Scrolling price bar
Horizontally scrolling bar, 20+ symbols, live bid + % change, green/red color-coded. | Info: XAU/USD, XAG/USD, EUR/USD, GBP/USD, USD/JPY, USDCHF, AUDUSD, USDCAD, DXY, VIX, BTC/USD, GC=F, CL=F, ^GSPC. | Source: Yahoo via CF Worker proxy.

**2. Trading Sessions** — Session open/close tracker
Sydney/Tokyo/London/New York OPEN/CLOSED with countdown ("closes in Xh Ym" / "opens in Xh Ym"). | Info: UTC session windows. | Source: Client-side UTC clock — no API.

**3. EUR/USD Price Card** — Primary forex display
Live price, 24h change, bid/ask/spread, 24h high/low, session open. | Info: EUR/USD live quote. | Source: Yahoo `EURUSD=X`.

**4. Gold Price Card (XAU/USD)** — Primary gold display
Spot price, 24h change/%, bid/ask/spread, high/low/open, 5-bar sparkline. | Info: Gold spot. | Source: Yahoo `XAU=F` and `GC=F`.

**5. US Dollar Index (DXY)** — Dollar strength display
DXY level + 24h change/%. | Info: USD Index. | Source: Yahoo `DX-Y.NYB`.

**6. Composite Bias Gauge** — Directional bias indicator
Animated needle gauge (BEARISH ↔ BULLISH) + score label, from multi-timeframe signals. | Info: RSI, MA cross, price position across D1/H4/H1/M15. | Source: Computed client-side from Yahoo OHLC.

**7. MTF Confluence Matrix** — Trend alignment grid
4-column grid (D1/H4/H1/M15) showing BUY ↑ / SELL ↓ / NEUTRAL → per timeframe. | Info: Signal agreement across TFs. | Source: Computed client-side from Yahoo OHLC.

**8. SMC Panel (Smart Money Concepts)** — Institutional structure display
Key S/R, order blocks (OB HIGH/LOW), Fair Value Gaps, market structure labels (BOS/CHoCH). | Info: Derived from price action. | Source: Computed client-side from Yahoo OHLC.

**9. Macro Regime** — Economic environment indicator
Risk Regime (RISK-ON/OFF), Business Cycle stage, recession probability bar, VIX, real yield, DXY trend. | Info: Cross-asset macro. | Source: Yahoo (`^VIX`, `DX-Y.NYB`) + FRED `DFII10`.

**10. Real Yield Panel** — Bond market monitor
10Y TIPS real yield, breakeven inflation, trend direction. | Info: 10Y TIPS (DFII10). | Source: FRED `fredgraph.csv?id=DFII10`.

**11. Fear & Greed Gauge** — Market sentiment gauge
0–100 gauge + classification + 35-day history sparkline. | Info: Daily sentiment (Extreme Fear → Extreme Greed). | Source: `api.alternative.me/fng/?limit=35`.

**12. Options Sentiment** — Options positioning display
Put/Call ratio (PCR), delta positioning, interpretation (BULLISH/NEUTRAL/BEARISH). | Info: Daily CBOE stats. | Source: CBOE daily stats, scraped via `api.codetabs.com/v1/proxy/`.

**13. Eco Surprises Index** — Data beat/miss tracker
Per-currency (USD/EUR/GBP/JPY/AUD/CAD/CHF/NZD) beat vs miss count + running score; user-updated via +/− buttons. | Info: User-entered beat/miss. | Source: User input → localStorage `fxdesk_eco_surprises_v1`.

**14. Live Chart (TradingView)** — Interactive candlestick chart
Symbol switcher (XAU/USD, EUR/USD, GBP/USD, USD/JPY, DXY, BTC/USD, US OIL, S&P 500), interval switcher (1m–W), pre-loaded Bollinger Bands + RSI + MACD. | Info: OHLCV candles. | Source: `tradingview.com/widgetembed/` sandboxed iframe (no key).

**15. Latest Gold News** — Curated news widget
5 latest articles: headline, source, relative timestamp, link; auto-refresh every 10 min. | Info: Gold news headlines. | Source: `api.rss2json.com` ← Kitco, FXStreet, Investing, DailyFX gold RSS.

**16. Economic Calendar (Dashboard inline)** — Macro events preview
7-day upcoming events: time, currency, event, forecast, previous, actual, impact color. | Info: CB/CPI/NFP/GDP events. | Source: MyFxBook JSON → Babypips scrape (fallback) → Forex Factory XML (fallback).

**17. Price Alerts** — Custom price notification system
User-set ABOVE/BELOW alerts per symbol; fires Telegram message on hit; status ACTIVE / HIT. | Info: User price levels; current prices polled. | Source: Yahoo (polling) + `api.telegram.org/bot{TOKEN}/sendMessage`.

**18. Correlation Matrix** — Asset correlation display
Pairwise correlation coefficients between tracked symbols; cached to reduce API calls. | Info: Rolling returns correlation. | Source: Yahoo multi-symbol OHLC.

**19. Gold ETF Flow** — Institutional flow proxy
GLD/IAU volume vs 20-day average as proxy for creation/redemption activity. | Info: ETF volume vs MA. | Source: Yahoo `GLD` and `IAU`.

**20. Pivot Points** — Technical level calculator
Classic pivots: R3/R2/R1/PP/S1/S2/S3 from previous session OHLC. | Info: Prev session H/L/C. | Source: Yahoo `XAU=F` (or active symbol).

**21. Volatility Range** — Daily range estimator
Projects expected session high/low range from ATR. | Info: ATR. | Source: Yahoo OHLC.

**22. Gold Seasonality** — Historical seasonal pattern
Historical avg gold returns by month/week. | Info: Multi-year seasonal averages. | Source: Hardcoded static data — no API.

**23. Gold/Silver Ratio** — Precious metals spread tracker
XAU÷XAG vs 5-year avg (~82) and historical high (~126). | Info: Gold & silver spot. | Source: Yahoo `XAU=F` and `XAG=F`.

**24. News Sentiment** — Headline sentiment analyzer
Classifies recent gold headlines positive/negative/neutral via keyword matching. | Info: RSS headlines. | Source: `api.rss2json.com` (same feeds as Gold News).

**25. DXY Trend Strength** — Dollar strength across timeframes
DXY trend direction + strength across Daily/H4/H1/M15. | Info: DXY OHLC multi-TF. | Source: Yahoo `DX-Y.NYB`.

**26. Currency Strength Meter** — Relative strength ranking
Ranks 8 majors (USD/EUR/GBP/JPY/AUD/CAD/CHF/NZD) by relative strength from cross-pair data. | Info: Cross-pair prices. | Source: Yahoo `{pair}` for major crosses.

**27. Crypto Prices** — Cryptocurrency price cards
Live cards: BTC/ETH/SOL/XRP/BNB/DOGE/ADA/AVAX with price + 24h change. | Info: Top 8 crypto. | Source: `api.coinbase.com` via CF Worker proxy (UI credits CoinGecko).

**28. Gold Calculator** — Position size calculator
Position value, pip value, P&L for gold trades from lot size + entry price. | Info: User lot size + price. | Source: Client-side calc — no API.

**29. Event Countdown** — Macro event timer
Countdown to next selected economic event (DD:HH:MM:SS). | Info: Event datetime. | Source: Derived from calendar data (MyFxBook / faireconomy).

**30. MTF Bias Summary** — Multi-timeframe bias summary
Condensed D1/H4/H1/M15 directional bias in one panel. | Info: TF-level signal. | Source: Yahoo OHLC (computed client-side).

**31. MTF Confluence Scanner** — High-confluence signal detector
Scans for signal alignment across TFs, highlights high-confluence setups. | Info: Overlapping signals. | Source: Yahoo OHLC (computed client-side).

**32. Rate Differential** — Interest rate spread
Rate differential between currency pairs as fundamental driver. | Info: CB benchmark rates. | Source: Hardcoded/manually maintained static data — no API.

**33. Round Number Levels** — Psychological level marker
Highlights key round levels (e.g. 2000/2050/2100 for gold) near current price. | Info: Computed grid around price. | Source: Derived from Yahoo current price.

**34. Key Levels** — Support/resistance display
Algorithmically detected swing highs/lows + structure levels. | Info: Historical swing points. | Source: Yahoo historical OHLC.

**35. Session Heatmap** — Volatility by session
Heatmap of historical volatility per hour across Tokyo/London/NY. | Info: Hist. volatility by session hour. | Source: Hardcoded historical data — no API.

**36. Hi-Lo Breakout** — Range breakout detector
Tracks break above N-day high / below N-day low. | Info: N-day H/L range. | Source: Yahoo historical OHLC.

**37. Spread Monitor** — Bid/ask spread tracker
Current spread in pips; flags unusually wide spreads. | Info: Live bid/ask. | Source: Yahoo quote data.

**38. CB Calendar** — Central bank event schedule (tab in Info Tabs panel)
Upcoming CB meetings, rate decisions, press conferences. | Info: CB meeting dates + currencies. | Source: Hardcoded static schedule + MyFxBook JSON.

---

## Journal Page Widgets (39–49)

Stats Bar, Entry Form, and Analytics: Summary Stats, Equity Curve, Mistake Breakdown, Monthly Returns, Max Drawdown, Win/Loss Streak, Best Day-of-Week Heatmap, Session Breakdown, Entry List, CSV Import/Export.
**Source:** localStorage `fxdesk_journal_v1` — all data user-entered, stored locally, no external API.

---

## Portfolio Page Widgets (50)

Account Stats Bar / Open Positions Table / Add Position Form.
**Source (prices):** Yahoo `query1.finance.yahoo.com/v8/finance/chart/{symbol}` — auto-fetched for live P&L.
**Source (positions):** localStorage `fxdesk_portfolio_v1` — user-entered position data.
