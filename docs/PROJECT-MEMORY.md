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

## 5. Open Questions / Parking Lot

- _(none yet — project not yet described)_
