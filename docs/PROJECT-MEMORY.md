# Project Memory — forex-desk

> **What this is:** A durable, git-committed memory/decision log for this project.
> It is the working stand-in for `claude-mem` in this remote/ephemeral environment,
> where a local memory DB (`~/.claude-mem/`) would be wiped when the container is
> reclaimed. Only what is committed to this repo survives across sessions.
>
> **Protocol (manual mem):**
> - **On session start** → read this file first to restore context.
> - **As decisions are made** → append to the Decision Log with a date.
> - **Before ending a work session** → make sure anything worth remembering is here and committed.

---

## 1. Project Overview

- **Name:** forex-desk
- **Status:** Brand-new project. Empty repo (README only) as of the first session.
- **Working branch:** `claude/kind-hawking-ine4zt`
- **Description:** _TBD — user is describing requirements across several prompts. Do not plan or ask questions until the user says "go"._

### Tech Stack (declared by user)

| Language / Tool | Role (as understood so far) |
|-----------------|------------------------------|
| **TypeScript** | Primary application language (type-safe JS) |
| **React + JSX** | UI component framework |
| **Tailwind CSS** | Styling — utility-class syntax **+ custom animations** |
| **SQL** | Relational database / queries |
| **Python** | (role TBD — backend, data, or scripting) |
| **JSON** | Config / data interchange |
| **SVG** | Vector graphics / icons |

> Implications to confirm later (NOT assumptions): React/JSX/Tailwind ⇒ web frontend; SQL + Python ⇒ a backend/data layer. Exact architecture, frameworks (Next.js? Vite? FastAPI/Flask/Django?), and DB engine still **undeclared** — wait for the user.

### What the app is (emerging picture)

**Forex Desk** — a Forex **trader's companion app**, built as an installable **PWA**. Real-time market data, a widget dashboard, an economic-news calendar with countdowns, a P&L portfolio, a trade journal with analytics, and a learning section.

### Proposed Architecture (user-provided, "keep in mind")

Frontend stack inferred from structure: **Vite** (`main.tsx` entry + `index.css`), **React Router** (`App.tsx` routing), **Shadcn/ui** (`components/ui/`), **Zustand** (stores), **PWA** (`manifest.json`).

```
Forex Desk/
├── public/                      # Static assets, icons, manifest.json (PWA install)
├── src/
│   ├── assets/                  # Images, custom SVGs, sound effects for price alerts
│   ├── components/              # Shared global UI components
│   │   ├── ui/                  # Buttons, Dialogs, Cards (Shadcn components)
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── context/ or store/       # Zustand stores (useJournalStore.ts, useMarketData.ts)
│   ├── hooks/                   # Custom hooks (useCountdown.ts, useLocalStorage.ts)
│   ├── pages/                   # The 6 core pages
│   │   ├── Welcome.tsx
│   │   ├── Dashboard/           # Widget-based landing page
│   │   │   ├── Dashboard.tsx
│   │   │   └── widgets/         # TickerWidget, SessionClockWidget, FearGreedWidget
│   │   ├── Calendar.tsx         # High-impact news countdown hero page
│   │   ├── Portfolio.tsx        # P&L calculation with stale-data check
│   │   ├── Journal.tsx          # Deep analytical database charts
│   │   └── Learning.tsx
│   ├── services/                # API integration + proxy communication
│   │   ├── api.ts
│   │   └── websocket.ts         # Real-time market data
│   ├── utils/                   # Math helpers (session checking, pips calc)
│   │   └── sessionCalc.ts
│   ├── App.tsx                  # Root component with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + Tailwind config
```

**Open architecture questions (do NOT resolve yet — for the brainstorm):**
- ~~Where do Python + SQL live?~~ → **Sharpened:** the `services/` "proxy" is a **Cloudflare Worker** (`forex-desk-proxy.zreik111.workers.dev`), not a Python/SQL backend. The 50-widget catalog needs **no SQL DB / no Python server**. So **where TS/SQL/Python fit is now the single biggest open question.** Hypotheses (UNCONFIRMED): Python = data-pipeline scripts generating the static datasets (seasonality, session heatmap, rate differentials) and/or Cloudflare Python Workers; SQL = Cloudflare D1 caching layer. Park for brainstorm.
- ~~Data provider?~~ → **Resolved:** Yahoo Finance (primary, via CF Worker), FRED, alternative.me, CBOE (scraped), RSS2JSON, MyFxBook/Babypips/ForexFactory, Telegram, Coinbase, TradingView iframe.
- ~~Persistence?~~ → **Resolved:** localStorage (`fxdesk_journal_v1`, `fxdesk_portfolio_v1`, `fxdesk_eco_surprises_v1`) + react-grid-layout layout.
- **New for brainstorm:** API-key handling & secrets (Telegram bot token, any keyed endpoints) — must live in the CF Worker, never in client bundle. CORS reliance on third-party proxies (codetabs, rss2json) = availability risk. Rate-limiting / caching strategy for Yahoo polling.

### Widgets — full catalog saved 📋

**50 widgets specified → [`docs/widgets/widget-catalog.md`](widgets/widget-catalog.md)** (every endpoint, symbol, and localStorage key). Includes a synthesized **Data Sources & Infrastructure** map.

- **~38 dashboard widgets** (Ticker, Sessions, EUR/USD & Gold hero cards, DXY, Composite Bias gauge, MTF Confluence, SMC, Macro Regime, Real Yield, Fear & Greed, Options Sentiment, Eco Surprises, TradingView chart, News, Eco Calendar, Price Alerts→Telegram, Correlation, ETF Flow, Pivots, Volatility, Seasonality, Gold/Silver ratio, News Sentiment, Currency Strength, Crypto, Calculator, Event Countdown, Round Numbers, Key Levels, Session Heatmap, Hi-Lo Breakout, Spread, CB Calendar, …)
- **Journal (39–49):** stats, entry form, analytics charts, CSV import/export — all localStorage.
- **Portfolio (50):** account stats, positions table, add-position form — localStorage + Yahoo live prices.
- **Pattern:** most indicators **computed client-side from Yahoo OHLC**; a few datasets are **hardcoded static** (seasonality, session heatmap, rate differential).

### App Shell & Pages — user's mental model 🖥️

**Welcome page** (`Welcome.tsx`): an entry/splash screen with theme + description that conveys the whole project's idea (first impression before entering the app).

**Landing = the app shell** seen on entering the web app:
1. **Header** with **logo** ("Forex Desk").
2. **Auto-updating clock** based on **user's location** (local time; distinct from the UTC-based Sessions widget).
3. **Light / dark mode toggle**.
4. **Header nav buttons** → pages built later: **Dashboard** (main), **Portfolio**, **Journal**, **Learn**, **Calendar**. *(User wrote "3 buttons" but listed 5 — treat as 5; confirm count in brainstorm.)*
5. **News sidebar** (`Sidebar.tsx`) — **news source still to be discussed**.
6. **Moving live ticker** under the header — live prices for FX pairs + crypto (the Live Price Ticker widget, #1).

Maps to the proposed architecture: Header→`Navbar.tsx`, News→`Sidebar.tsx`, ticker→`TickerWidget`, pages→`pages/` (Welcome, Dashboard, Portfolio, Journal, Learning, Calendar).

> **Logged for brainstorm (NOT resolved):**
> - **Light mode vs dark-only design system.** `linear-modern.md` is spec'd as deep-space dark (ambient blobs, glows, near-black canvas). A real light mode means designing light variants of every signature effect — non-trivial. Confirm whether light mode is full-fidelity or a simpler high-contrast alternative.
> - **Nav count** "3 vs 5" slip (above).
> - **News source** for the sidebar (catalog already has gold RSS via rss2json — confirm whether the sidebar reuses those or needs a broader general-news source).

**Dashboard / widget-grid controls:**
- **Edit button** → enters edit mode (react-grid-layout): **arrange, remove, and move** widgets (drag + resize); persists layout to localStorage. (Implies add-widget too.)
- **Search bar** → *(scope to confirm: search/add widgets from the catalog, or a global symbol/data search? Assume widget search+add for now.)*
- **Refresh button** → manual data refresh, **styled to the Linear/Modern theme** (accent glow, expo-out micro-interaction).

### Engineering Decisions (declared by user)

| Decision | Detail |
|----------|--------|
| **react-grid-layout** | Dashboard widgets are **draggable & resizable**. The Dashboard is a customizable widget grid (TickerWidget, SessionClockWidget, FearGreedWidget, …). |
| **localStorage** | Client-side persistence — widget layout, journal entries, portfolio, prefs. (Matches `useLocalStorage.ts` hook.) Implies an offline-capable, client-heavy PWA. |

### Design System — "Linear / Modern" 🎨

**Full spec saved verbatim → [`docs/design-system/linear-modern.md`](design-system/linear-modern.md). Follow it exactly.**

Quick-reference DNA (do not paraphrase the file — these are reminders):
- **Aesthetic:** premium dev-tool / cinematic dark (Linear, Vercel, Raycast). Dark but not oppressive.
- **Colors:** canvas `#050506` (never pure black), text `#EDEDEF`, muted `#8A8F98`, single accent **indigo `#5E6AD2`** (+ `#6872D9` hover). Surfaces = translucent white 5-8%.
- **Background:** layered — base radial gradient + SVG noise (0.015) + animated blurred blobs + 64px grid (0.02). Never flat.
- **Type:** Inter / Geist Sans; gradient-fill headlines; mono `tracking-widest` labels.
- **Depth:** multi-layer shadows (border highlight + diffuse + accent glow); mouse-tracking spotlights; rounded-2xl cards.
- **Motion:** 200-300ms, **expo-out `[0.16,1,0.3,1]`**, tiny 4-8px moves, no bounce. Respect `prefers-reduced-motion`.
- **Layout:** asymmetric bento grids (varied col-spans), generous spacing (`py-24`→`py-32`).
- **Signature musts:** ambient blobs, spotlights, gradient text, multi-layer shadows, parallax, precision micro-interactions.

> **Note on a tool tension (for the brainstorm, NOT a pushback):** `ui-ux-pro-max`'s default fintech recommendation leans gold + "avoid AI purple/pink gradients." The user has **deliberately** chosen the Linear/indigo system — a high-craft, intentional aesthetic, the opposite of generic AI-slop gradients. **User's explicit choice wins.** I'll use `ui-ux-pro-max` for accessibility/UX rules and chart guidance, but the *visual language* is Linear/Modern.

## 2. Environment & Tooling

> ⚠️ **Ephemeral caveat:** Everything cloned into `~/.claude/plugins/marketplaces/`
> lives only in this session's container and disappears when it is reclaimed.
> It works **this session only**. To persist tools across sessions, add them to the
> environment's setup/startup config (see https://code.claude.com/docs/en/claude-code-on-the-web).

| Tool | This session | How it's used |
|------|--------------|---------------|
| **ui-ux-pro-max** | ✅ Runnable | `python3 ~/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` (and `--domain`, `--stack`). Follow its Quick-Reference rules + pre-delivery checklists. |
| **superpowers** | ✅ Methodology loaded | Process framework. Flow: `brainstorming` → spec in `docs/superpowers/specs/` → `writing-plans` → plan in `docs/superpowers/plans/` → `executing-plans`/`subagent-driven-development`. Also TDD, systematic-debugging, verification-before-completion. |
| **Context7** | ✅ Connected (MCP) | Live library/framework docs via `mcp__Context7__*`. Use before relying on memory for any library API. |
| **claude-mem** | ❌ Not active | Hook-based + needs worker/Chroma/restart; local DB is ephemeral. Replaced by THIS file. |
| **ruflow (claude-flow v3.5)** | ✅ Skills loaded | 72 skills incl. SPARC, Vibe Coding Academy, swarm patterns. MCP servers (ruv-swarm, flow-nexus) not active this session — methodology applied manually. Script: `~/.claude/plugins/marketplaces/ruflow/` |

## 3. Working Agreement

- User will describe the project over several prompts.
- **Do NOT** start planning, brainstorming, or asking clarifying questions until the user explicitly says to begin.
- When the user gives the go-ahead: run the superpowers `brainstorming` flow (one question at a time → 2–3 approaches → design → spec), then `writing-plans`.
- Apply `ui-ux-pro-max` for every UI/visual/interaction decision.
- Per superpowers' own rule, **user instructions take precedence** over any skill default.

## 4. Decision Log

| Date | Decision / Note |
|------|-----------------|
| 2026-06-24 | 🐛 **Fixed dashboard drag/move (was silently broken) + made resize discoverable.** Drag failed **only in dev**: react-grid-layout reads `process.env.NODE_ENV` at runtime and Vite doesn't expose `process` in the browser → the drag handler threw `process is not defined` and aborted (prod build replaces it, so only `dev.sh`/`vite dev` users hit it). Fix → `define: { 'process.env.NODE_ENV': JSON.stringify(mode) }` in `vite.config.ts` (restart with `--force` to re-bundle deps). **Resize:** handles existed but defaulted to `['se']` at `opacity:0` until hover (undiscoverable, and hover fails on touch). Per `ui-ux-pro-max` (don't rely on hover; visible affordance; adequate hit area) → added `['se','s','e']` handles, reveal them in edit mode via an `rgl-editing` container class, and styled branded indigo grips (corner + edge bars). Verified via Playwright: drag moves the item, corner-resize grows 313×224→422×304, 18 handles visible (opacity 1) in edit mode, no `process` error. 21 frontend tests, lint clean, build passes. |
| 2026-06-24 | 🧰 **Vendored `ui-ux-pro-max` as a project skill** → `.claude/skills/ui-ux-pro-max/` (SKILL.md + 20 data CSVs + scripts), so `/ui-ux-pro-max` is invocable in **future** sessions (skills load at session start, so not retroactively this one). Patched `scripts/design_system.py` (a Python-3.12-only backslash-in-f-string that crashed the CLI on 3.11); verified `search.py --design-system` runs. **Caveat:** the skill's default fintech palette (amber/violet, Fira fonts) differs from our chosen **Linear/Modern indigo + Inter** — the user's design system still governs; the skill is used for its UX/a11y guidelines + on-demand design intelligence, not to repaint the app. |
| 2026-06-24 | ✅ **A11y/UX polish pass via `ui-ux-pro-max` guidelines.** The skill ships in the `ruflow` marketplace but isn't an enabled invocable skill here (and its `search.py` has a 3.12-only f-string bug → crashes on 3.11), so I read its `SKILL.md` + `ux-guidelines.csv`/`web-interface.csv` directly and applied the checklist to the new landing/theme. Fixes (all HIGH/CRITICAL): **touch targets** — header CTAs `max-sm:h-11` (32→44px on mobile); **readable body** — feature/step copy `text-base sm:text-sm` (16px on mobile); **decorative icons** `aria-hidden`. Verified on a 375px viewport: header links 44px, **no horizontal scroll**, 16px body. Already-passing: reduced-motion (global rule + `useReducedMotion`), focus-visible rings, color-not-alone (▲▼ + signs), h1→h2→h3 hierarchy, semantic landmarks, `lang`/viewport(`viewport-fit=cover`). 21 frontend tests, lint clean, build passes. |
| 2026-06-24 | ✅ **UI polish + dashboard-grid bug fix (user-requested).** (1) **Fixed "added widgets stack horizontally / crash" bug** → root cause was react-grid-layout v2's **`Responsive` wrapper** driving an infinite `setState` loop ("Maximum update depth exceeded") on add: its per-render layout re-derivation + the controlled `onLayoutChange`→store feedback never converged (vertical compaction was non-idempotent, ping-ponging items between two y's). Fix: drive the **base `GridLayout`** directly (pick breakpoint/layout/cols ourselves from `useContainerWidth`), **`noCompactor`** (WYSIWYG placement), memoized `children`/`gridConfig`/drag+resize configs (stable identities), persist only on **`onDragStop`/`onResizeStop`** (not per-render), and a **first-fit `findSlot`** so added widgets pack tidily. (2) **Background → near-black:** neutralized blue/purple ambient blobs to faint indigo (`--blob-*`, dark+light). (3) **Widget "pop":** beefier multi-layer card shadows + top inner-glow + hover lift/border-brighten (`--shadow-card*`, `WidgetFrame`). (4) **Landing page redesigned** (`Welcome.tsx`) from the user's inspiration HTML — sticky header, hero w/ 3D dashboard-preview mock + shimmer headline, ticker strip, bento features, how-it-works, stats, CTA, footer (framer-motion `whileInView`, reduced-motion safe); `IntersectionObserver`/`ResizeObserver` stubs added to test setup. **Verified E2E via Playwright** (add 6 → 12 widgets, no loop, packed grid; landing + dashboard screenshots). +2 store regression tests → **21 frontend tests, lint clean, build passes.** (`ui-ux-pro-max` skill not installed this session → applied the project's documented Linear/Modern system + the inspiration file.) |
| 2026-06-21 | Session start. User requested 4 tools: ui-ux-pro-max, superpowers, Context7, claude-mem. First three set up & usable; claude-mem replaced by this committed memory log due to ephemeral/hook constraints. |
| 2026-06-21 | Standing by for project description. No planning/questions until user says go. |
| 2026-06-21 | ruflow (ruvnet/claude-flow v3.5 fork) installed. Key additions: SPARC methodology (Spec→Pseudocode→Architecture→Refinement→Completion), Vibe Coding Academy 12 binding principles (plan-first, surgical changes, no blue/purple AI-slop UIs, push-to-branch when working, etc.), 72 skills including swarm/orchestration. MCP servers need restart to activate. |
| 2026-06-21 | **Tech stack declared:** TypeScript, SQL, React, JSX, Tailwind (utility + custom animations), JSON, SVG, Python. Architecture/frameworks/DB engine not yet specified. |
| 2026-06-21 | **App identified:** Forex Desk — a trader's companion PWA. **Proposed frontend architecture provided** (Vite + React Router + Shadcn + Zustand). 6 pages: Welcome, Dashboard (widgets), Calendar (news countdown), Portfolio (P&L), Journal (analytics), Learning. Real-time data via WebSocket; price-alert sounds. Backend (Python/SQL) location TBD. Full tree saved in §1. |
| 2026-06-21 | **Engineering:** react-grid-layout (draggable/resizable widgets) + localStorage (client persistence). Frontend persistence question resolved → localStorage. |
| 2026-06-21 | **Design system chosen: "Linear / Modern"** — cinematic dark dev-tool aesthetic, indigo `#5E6AD2` accent, layered ambient lighting, multi-layer shadows, expo-out micro-interactions. Saved verbatim to `docs/design-system/linear-modern.md`. Noted (not resolved) that this differs from ui-ux-pro-max's default fintech palette; user's explicit choice governs the visual language. |
| 2026-06-21 | **50 widgets specified** → saved to `docs/widgets/widget-catalog.md` with full data-source map. Key finding: the `services/` proxy is a **Cloudflare Worker** (`forex-desk-proxy.zreik111.workers.dev`); architecture is **client-side PWA + CORS proxies + localStorage** with no SQL/Python required by the widgets. Data providers resolved (Yahoo, FRED, alternative.me, CBOE, RSS2JSON, MyFxBook/ForexFactory, Telegram, Coinbase, TradingView). Python/SQL role is now the top open question for the brainstorm. Telegram bot token + secrets must stay server-side in the Worker. |
| 2026-06-21 | **App shell / Welcome + Landing layout described** (see §1): Welcome splash; header (logo, geo-clock, light/dark toggle, nav→Dashboard/Portfolio/Journal/Learn/Calendar), news sidebar, live ticker under header. Flags logged: light-mode vs dark-only design system, "3 vs 5" nav slip, news-source TBD. |
| 2026-06-21 | **Dashboard controls added:** edit mode (arrange/remove/move widgets via react-grid-layout), search bar, themed refresh button. |
| 2026-06-21 | ▶️ **GO signal received** — user said "you can start making the plan." Transitioning from standby into the planning workflow (superpowers brainstorming → spec → writing-plans). Resolving parked blocking questions first. |
| 2026-06-21 | ✅ **4 blocking decisions answered.** (1) **Architecture = Python backend + SQL DB.** (2) Plan scope = user deferred to me → chose **phased / foundation-first**. (3) Light mode = **full-fidelity light + dark**. (4) **Cloudflare Worker DROPPED** — "forget the proxy, use Python+SQL." The Python backend now IS the data/proxy layer (proxy all upstream APIs, hold secrets, cache in SQL, WebSocket price push). |
| 2026-06-21 | **My backend tech picks:** FastAPI + Pydantic + httpx (async proxy) + SQLAlchemy + Alembic; DB engine Postgres (prod) / SQLite (dev) via SQLAlchemy so it's swappable; WebSocket for live prices; APScheduler for upstream polling. |
| 2026-06-21 | ✅ **2 more decisions:** Indicators = **hybrid** (heavy math server-side Python/pandas + cached; trivial calcs client-side). User data = **server-side from day one** (SQL source of truth → adds lightweight email+password+JWT auth; layout/journal/portfolio/alerts/eco-surprises all user-scoped in DB). |
| 2026-06-21 | ✅ **PLAN APPROVED** (plan mode). Saved to `/root/.claude/plans/humming-wibbling-papert.md`. Monorepo `frontend/` (Vite+React+TS PWA) + `backend/` (FastAPI). 8 phases, foundation-first. **Now executing Phase 0** (monorepo + tooling + full light/dark Linear tokens + primitives + ambient bg + motion). |
| 2026-06-21 | 🏗️ **Phase 0 part 1 done & verified.** Scaffolded `frontend/` (Vite 8 + React 19 + TS 6 + Tailwind v4 + Zustand 5 + React Router 7 + react-grid-layout 2 + framer-motion 12 + recharts 3 + lucide). Full **light+dark Linear token system** in `src/index.css` (theme-reactive via `@theme inline`, `@custom-variant dark`). `cn()` helper, `@/` alias, Vitest+RTL (2 tests pass), build passes. Scaffolded `backend/` (FastAPI + `/health`, pydantic-settings, pytest passes, ruff+black clean). Root README/.gitignore/package.json + prettier. |
| 2026-06-21 | ✅ **PHASE 0 COMPLETE.** Added `Background.tsx` (4-layer ambient), `lib/motion.ts` (expo-out variants), UI primitives `Button`/`Card`(spotlight)/`Input`/`Badge` + tests (5 frontend tests pass), App playground. Added **SessionStart hook** (`.claude/hooks/session-start.sh` + `settings.json`) — web-only, sync, idempotent; validated (hook✅ lint✅ test✅). Next: **Phase 1** (backend DB+auth, app shell, live ticker). |
| 2026-06-22 | ✅ **PHASE 4 (Portfolio) + PHASE 5 (Journal) COMPLETE.** Portfolio: Position model + CRUD, server-side live P&L + account stats (`/api/portfolio`), page w/ stats bar + add form + positions table. Journal: JournalEntry model + CRUD (`/api/journal`), `lib/journalAnalytics.ts` (summary, equity curve, monthly/session/weekday, drawdown, streaks, CSV), page w/ Recharts (equity area + bar panels) + entry form + table + CSV import/export. **40 backend tests, 12 frontend tests, all green.** Pages live: Welcome, Dashboard (33 widgets), Portfolio, Journal. Remaining: Calendar, Learn pages; Phase 8 PWA/polish (+ Recharts code-split). |
| 2026-06-22 | ✅ **PHASE 6 (Calendar) + PHASE 7 (Learn) COMPLETE.** Calendar: `services/calendar.py` (Forex Factory weekly JSON proxy `ff_calendar_thisweek.json`), `GET /api/calendar` (1h SQL cache, graceful `unavailable`), `pages/Calendar.tsx` (next-high-impact countdown hero, impact filter all/high/med/low, events grouped by day w/ impact dots + currency + forecast/previous), **+ `EconomicCalendarWidget`** (compact upcoming-events dashboard widget reusing `/api/calendar`) registered → **34 widgets**. Learn: `lib/learnContent.ts` (10 full lessons across 6 tracks — Foundations, Technical Analysis, Smart Money, Risk, Psychology, Gold & Macro — + 16-term glossary), `pages/Learning.tsx` (category filter + lesson card grid + full-screen lesson reader w/ takeaways + glossary, Linear/Modern styled). **41 backend tests, 12 frontend tests, lint clean, build passes.** All 6 pages now live & functional. Remaining: **Phase 8** (PWA manifest/SW/install, offline, price-alert sounds, a11y pass, Recharts/route code-split for the 793 KB bundle, full light/dark QA). |
| 2026-06-22 | 🏁 **PHASE 8 (PWA + polish) — substantially complete.** (1) **Installable PWA:** `vite-plugin-pwa` (autoUpdate SW + Workbox precache, `navigateFallback` for SPA, denylist `/api` `/ws`), web manifest (standalone, `start_url:/dashboard`, finance category), **branded indigo candlestick icons** (192/512 `any` + 512 `maskable` + apple-touch, rasterized from SVG via headless Chromium), apple-mobile-web-app meta + SVG favicon. **Verified at runtime: SW state `activated`, manifest valid w/ maskable** (Playwright on `vite preview`). (2) **Route code-splitting:** all pages `lazy()` behind `<Suspense>` + `RouteFallback` → **main bundle 793 KB → 243 KB**; recharts (Journal 358 KB) + react-grid-layout (Dashboard 116 KB) load only on their routes; 500 KB warning gone. (3) **Price-alert sounds:** `lib/sound.ts` WebAudio two-note chime (no asset, SSR/test-safe), `PriceAlertsWidget` polls 30s + chimes on ACTIVE→HIT (seeds silently), persisted `soundEnabled` + speaker mute toggle. (4) **A11y:** skip-to-content link + `<main id tabIndex>` landmark (global focus-visible rings + reduced-motion already in place). **16 frontend tests (+4), 41 backend tests, lint clean, build passes.** Commits: code-split+PWA, sounds, a11y. **Deferred (optional):** list virtualization, deeper offline API runtime-caching, Options-Sentiment widget (CBOE scrape). **App is feature-complete across all 6 pages + 34 widgets + installable PWA.** |
| 2026-06-22 | ✅ **Options Sentiment widget — the last deferred item — built → 35 widgets.** `services/cboe.py` (CBOE total put/call-ratio CSV proxy; robust `parse_putcall` that prefers a ratio column else derives puts/calls; `classify` ⇒ Fear ≥1.0 / Greed ≤0.7 / Neutral), `GET /api/options-sentiment` (1h SQL cache → ratio + sentiment + 35pt history), `OptionsSentimentWidget` (value + sentiment label + sparkline, mirrors RealYieldWidget) registered under Sentiment. **+2 backend tests (43 total), 16 frontend tests, lint/ruff clean, build passes.** Endpoint fully exercised in tests (only the live CBOE fetch is mocked — egress-blocked here, returns `unavailable` at runtime until allowlisted, like all live-data widgets). **Original 50-widget catalog now fully addressed; dashboard widget set complete.** |
| 2026-06-22 | ✅ **Nice-to-haves done (offline data + list virtualization).** (1) **Offline API runtime-caching:** Workbox `runtimeCaching` NetworkFirst for GET `/api/*` (cache `fxdesk-api`, 5s network race, 24h/120-entry expiry) → installed PWA shows last-known data offline; verified `NetworkFirst`+`fxdesk-api` present in generated `sw.js`. (2) **List virtualization:** dependency-free `useVirtualRows` fixed-row-height windowing hook (+3 tests) applied to the Journal entries table (sticky header, 48px rows, activates >40 rows). **Verified via Playwright with a seeded 150-entry journal: only 28 rows in the DOM, window slides on scroll (top date 2026-05-30 → 2026-02-23); analytics compute correctly (P&L $7,975, 60.67% win, PF 2.36).** 19 frontend tests, 43 backend tests, lint clean, build passes. **⚠️ Env blockers (not code): (a) GitHub MCP server disconnected → cannot open PR programmatically this session (provide compare URL); (b) all upstream egress returns HTTP 403 from the env proxy → live data needs the environment's network policy to allowlist query1.finance.yahoo.com, fred.stlouisfed.org, nfs.faireconomy.media, api.alternative.me, cdn.cboe.com (+ rss/coinbase).** |
| 2026-06-22 | ✅ **PHASE 3 ~COMPLETE.** Batch E (+3 → **33 widgets**): Eco Surprises (+/− counters, server-persisted), Price Alerts (CRUD + Telegram delivery via poller `check_alerts`/`alert_hit`), Event Countdown (client). Backend: EcoSurprise + PriceAlert models, `/api/eco-surprises`, `/api/alerts` CRUD, telegram service, config telegram vars (33 backend tests). Only **Options Sentiment** (CBOE HTML scrape — fragile/egress-blocked) deferred. Dashboard widget catalog essentially done. |
| 2026-06-22 | 🚧 **PHASE 3 cont.** Batch D (+6 → **30 widgets**): SMC panel (BOS/swing/FVG), correlation matrix, ETF flow (volume), DXY trend (reuses MTF endpoint), + static spread monitor & CB calendar (backend: smc indicator + returns/pearson + extract_volumes; smc/correlation/etf-flow endpoints, 28 tests). User picked "more widgets". **Remaining (need user-data models or external): options sentiment (CBOE scrape), eco surprises (+/− buttons, user data), price alerts (Telegram), event countdown (calendar).** |
| 2026-06-22 | 🚧 **PHASE 3 cont.** Batch C (+7 → **24 widgets**): MTF confluence, Hi-Lo breakout, key levels (backend: key_levels indicator + mtf/hilo/key-levels endpoints, 25 tests), currency strength (client-computed from quotes), + static datasets seasonality, session heatmap, rate differential. **Remaining (~12, niche):** SMC panel, correlation matrix, options sentiment, ETF flow, DXY trend strength, spread monitor, eco surprises, event countdown, price alerts (Telegram), CB calendar. Consider Phase 4/5 (Portfolio/Journal pages) for higher functional value next. |
| 2026-06-21 | 🚧 **PHASE 3 IN PROGRESS** (remaining dashboard widgets). **17 widgets** built so far. Batch A: pivots, volatility (ATR), gold/silver ratio, crypto, round numbers, gold calculator, TradingView (backend: extract_candles + pivot_points + atr endpoints). Batch B: gold news + news sentiment (RSS via rss2json + keyword classify), 10Y real yield (FRED CSV), macro regime (VIX+real-yield). Backend 22 tests, frontend 12 tests, all green. **Still remaining (~20):** MTF confluence/scanner/bias-summary, SMC panel, correlation matrix, currency strength, key levels, hi-lo breakout, spread, ETF flow, DXY trend, options sentiment, eco surprises, seasonality (static), session heatmap (static), rate differential (static), event countdown, price alerts (Telegram), CB calendar. |
| 2026-06-21 | ✅ **PHASE 2 COMPLETE & VERIFIED E2E.** **Backend** (+6 tests, 17 total): `DashboardLayout` model + `GET/PUT /api/layout` (JWT, server source of truth), `DataCache` + `get_cached`, `GET /api/fear-greed` (alt.me proxy), `GET /api/indicators/bias` (server-side RSI/MA composite from Yahoo OHLC). **Frontend** (+4 tests, 12 total): widget framework (`WidgetFrame`, `useWidgetData` + global refresh bus, `Gauge`/`Sparkline` SVG, registry), **react-grid-layout v2** grid (`useContainerWidth` + `dragConfig`/`resizeConfig` — v2 dropped WidthProvider/findDOMNode for React 19), **edit mode** (drag/resize/remove), `AddWidgetMenu` w/ search, themed refresh, **server-persisted layout** (`useLayout`, debounced PUT). 6 widgets: EUR/USD, Gold, DXY cards, Trading Sessions (client UTC), Fear & Greed gauge, Composite Bias gauge (server). **Verified via Playwright** (dashboard + edit mode + light, screenshots sent; bias computed BULLISH 54.2). Next: **Phase 3** (remaining ~30 dashboard widgets by data cluster). |
| 2026-06-21 | ✅ **PHASE 1 COMPLETE & VERIFIED E2E.** **Backend** (11 pytest): async SQLAlchemy (User+QuoteCache), JWT auth (bcrypt direct — passlib dropped due to bcrypt4 incompat), `/api/auth/{register,login,me}`, Yahoo proxy `/api/quotes` w/ 15s SQL cache, `/ws/prices` WebSocket + background poller. **Frontend** (8 vitest): React Router (6 routes), Welcome, Login/Register (shared AuthForm), ProtectedRoute, app shell (Navbar w/ geo-Clock + ThemeToggle + nav + mobile menu, Sidebar news placeholder, AppLayout), Zustand stores (useAuth/useSettings/useMarketData), api.ts + websocket.ts, TickerWidget (WS + REST snapshot). Button gained asChild (Radix Slot). **Verified via Playwright**: register→dashboard→theme-toggle→mobile, screenshots sent. **Env note:** Yahoo egress blocked here (quotes seed-demoed); user must allowlist `query1.finance.yahoo.com` for live data. Fixed 422 error display in api.ts. Next: **Phase 2** (dashboard grid + edit mode + core widgets). |

## 5. Open Questions / Parking Lot

- _(none yet — project not yet described)_
