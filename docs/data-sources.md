# Data sources

What every widget reads, whether it's **live** (proxied through the backend with a
short SQL cache) or **curated** (a static, slow-moving dataset we refresh by hand),
and where attribution links point. Live data needs the host to reach the upstream —
blocked in the dev container, available on Render.

## Live (backend → upstream, cached)

| Data | Upstream | Endpoint / service |
|------|----------|--------------------|
| Quotes, ticker, hero cards, crypto, currency strength | Yahoo Finance v8 chart | `/api/quotes` · `yahoo.py` |
| Hero bid/ask/open (single-symbol) | Yahoo Finance v7 quote | `/api/quotes` (best-effort) · `yahoo.fetch_quote_detail` |
| Bias, MTF, **composite**, pivots, volatility, hi-lo, key levels, SMC, correlation, ETF flow, DXY trend | Yahoo OHLC (computed server-side) | `/api/indicators/*` |
| Fear & Greed | alternative.me `fng?limit=35` | `/api/fear-greed` · `sentiment.py` |
| 10Y real yield + breakeven, macro regime | FRED `DFII10` / `T10YIE` (+ VIX) | `/api/real-yield`, `/api/macro-regime` · `fred.py` |
| Options sentiment (put/call) | CBOE daily stats CSV | `/api/options-sentiment` · `cboe.py` |
| News + news sentiment | Kitco / FXStreet / Investing / DailyFX RSS via RSS2JSON | `/api/news` · `news.py` |
| Economic calendar | Forex Factory weekly JSON | `/api/calendar` · `calendar.py` |
| Retail sentiment | MyFXBook community outlook | `/api/retail-sentiment` · `sentiment.py` |
| COT positioning | CFTC | `/api/cot` · `cot.py` |
| Chart | TradingView embed (iframe) | `TradingViewWidget` |

## Curated (static, indicative — refresh by hand)

Slow-moving macro reference data. Each carries an on-card "indicative / as-of" label;
refresh the dataset + its as-of marker on the cadence below.

| Data | File | Cadence |
|------|------|---------|
| Central-bank policy rates + next-move bias | `frontend/src/lib/centralBanks.ts` (`CB_AS_OF`) | after each decision cycle (~6 wks/bank) |
| Seasonality | `frontend/src/lib/*` (seasonality widget) | annually |
| Session heatmap | static | rarely (session hours) |
| Rate differential | derived from the CB-rates dataset | with the CB-rates refresh |

> **Note on "rate expectations":** the next-move bias (hike/cut/hold + next meeting)
> in the CB-rates widget is curated, not market-implied. A live version would need a
> rates-futures feed (e.g. CME FedWatch), which has no clean free API — kept curated
> and clearly labeled instead.

## User data (persisted)

Accounts, journal, portfolio, price alerts, eco-surprises and dashboard layout are
stored server-side (Postgres on Render — see `DEPLOY.md`); theme + sound prefs live
in `localStorage`.
