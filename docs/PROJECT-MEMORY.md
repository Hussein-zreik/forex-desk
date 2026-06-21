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
- Where do **Python + SQL** live? `services/` mentions a "proxy" — likely a separate backend (market-data proxy + journal/portfolio persistence). Not shown in this tree.
- Data source / API provider for forex quotes & economic calendar (and is a backend proxy needed for API keys/CORS)?
- ~~Persistence: localStorage vs SQL~~ → **Frontend persistence = localStorage** (confirmed; see Engineering). SQL/Python role still likely a server-side proxy — TBD.

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
| 2026-06-21 | Session start. User requested 4 tools: ui-ux-pro-max, superpowers, Context7, claude-mem. First three set up & usable; claude-mem replaced by this committed memory log due to ephemeral/hook constraints. |
| 2026-06-21 | Standing by for project description. No planning/questions until user says go. |
| 2026-06-21 | ruflow (ruvnet/claude-flow v3.5 fork) installed. Key additions: SPARC methodology (Spec→Pseudocode→Architecture→Refinement→Completion), Vibe Coding Academy 12 binding principles (plan-first, surgical changes, no blue/purple AI-slop UIs, push-to-branch when working, etc.), 72 skills including swarm/orchestration. MCP servers need restart to activate. |
| 2026-06-21 | **Tech stack declared:** TypeScript, SQL, React, JSX, Tailwind (utility + custom animations), JSON, SVG, Python. Architecture/frameworks/DB engine not yet specified. |
| 2026-06-21 | **App identified:** Forex Desk — a trader's companion PWA. **Proposed frontend architecture provided** (Vite + React Router + Shadcn + Zustand). 6 pages: Welcome, Dashboard (widgets), Calendar (news countdown), Portfolio (P&L), Journal (analytics), Learning. Real-time data via WebSocket; price-alert sounds. Backend (Python/SQL) location TBD. Full tree saved in §1. |
| 2026-06-21 | **Engineering:** react-grid-layout (draggable/resizable widgets) + localStorage (client persistence). Frontend persistence question resolved → localStorage. |
| 2026-06-21 | **Design system chosen: "Linear / Modern"** — cinematic dark dev-tool aesthetic, indigo `#5E6AD2` accent, layered ambient lighting, multi-layer shadows, expo-out micro-interactions. Saved verbatim to `docs/design-system/linear-modern.md`. Noted (not resolved) that this differs from ui-ux-pro-max's default fintech palette; user's explicit choice governs the visual language. |

## 5. Open Questions / Parking Lot

- _(none yet — project not yet described)_
