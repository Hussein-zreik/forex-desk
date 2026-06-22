# Forex Desk

A trader's command center for forex, gold, and macro markets — an installable **PWA**
with a customizable widget **Dashboard**, plus **Portfolio**, **Journal**, **Learn**, and
**Calendar** pages, wrapped in a cinematic **"Linear / Modern"** design system (full light + dark).

## Monorepo layout

```
forex-desk/
├── frontend/   # Vite + React + TypeScript PWA (Tailwind v4, shadcn/ui, Zustand, react-grid-layout)
├── backend/    # FastAPI + SQLAlchemy data/compute/proxy service (Python)
└── docs/       # Requirements, widget catalog, and design system (source of truth)
```

## Documentation (source of truth)

- [`docs/PROJECT-MEMORY.md`](docs/PROJECT-MEMORY.md) — decisions, architecture, working log
- [`docs/widgets/widget-catalog.md`](docs/widgets/widget-catalog.md) — all ~50 widgets + data sources
- [`docs/design-system/linear-modern.md`](docs/design-system/linear-modern.md) — visual language / tokens

## Run it locally (see it in your browser)

### Option A — one command (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/hussein-zreik/forex-desk
cd forex-desk
docker compose up --build
```

Then open **http://localhost:5173** and create an account on the Welcome screen.
Live market data flows automatically (your machine has normal internet access).
Stop with `Ctrl+C`; reset data with `docker compose down`.

### Option B — one command, no Docker

Needs Python 3.11+ and Node 18+. The script sets up the virtualenv, installs
dependencies on first run, launches both servers, and stops both on `Ctrl+C`.

```bash
git clone https://github.com/hussein-zreik/forex-desk
cd forex-desk
./dev.sh
```

Then open **http://localhost:5173**. (On Windows, run it from Git Bash or WSL.)

### Option C — two terminals (manual)

Needs Python 3.11+ and Node 18+.

**Terminal 1 — backend**
```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000        # API + docs at /docs
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev                                      # http://localhost:5173
```

Open **http://localhost:5173**. The frontend defaults to the backend at
`http://localhost:8000`, the database is a zero-setup SQLite file, and CORS is
preconfigured — no `.env` required.

**Dev checks:** `npm run test` (Vitest) and `npm run build` in `frontend/`; `pytest` in `backend/`.

## Architecture

Frontend talks to the FastAPI backend over REST + WebSocket. The backend proxies all
upstream APIs (Yahoo Finance, FRED, etc. — solving CORS and hiding secrets), caches in SQL,
computes heavy indicators server-side, and pushes live prices. User data (journal, portfolio,
alerts, dashboard layout) is persisted server-side behind lightweight JWT auth.

See the build roadmap and rationale in `docs/PROJECT-MEMORY.md`.
