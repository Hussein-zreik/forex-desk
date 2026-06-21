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

## Quick start

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run test       # Vitest + React Testing Library
npm run build
```

**Backend**
```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload   # http://127.0.0.1:8000  (docs at /docs)
pytest
```

## Architecture

Frontend talks to the FastAPI backend over REST + WebSocket. The backend proxies all
upstream APIs (Yahoo Finance, FRED, etc. — solving CORS and hiding secrets), caches in SQL,
computes heavy indicators server-side, and pushes live prices. User data (journal, portfolio,
alerts, dashboard layout) is persisted server-side behind lightweight JWT auth.

See the build roadmap and rationale in `docs/PROJECT-MEMORY.md`.
