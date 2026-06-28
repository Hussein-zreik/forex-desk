# Deploying Forex Desk (free, no domain)

The whole platform runs as **one service** behind **one URL**: FastAPI serves the
built React app *and* the `/api` + `/ws` routes from the same origin. So you get
a real, shareable link to surf as a user — live prices, refresh, the lot — with
no custom domain, no separate frontend host, and no CORS to configure.

How it fits together:

- The root [`Dockerfile`](./Dockerfile) builds the frontend (`VITE_API_URL=""`,
  so the app calls its own origin) and bundles `dist` into the backend image at
  `backend/static`.
- `app.main` serves that folder when present (deep links like `/dashboard`
  fall back to `index.html`), and keeps `/api/*`, `/ws/prices`, `/health`.

## Render (recommended — free, persistent URL)

1. Push this repo to GitHub (already done).
2. Render dashboard → **New +** → **Blueprint** → pick this repo.
   Render reads [`render.yaml`](./render.yaml) and builds the root Dockerfile.
3. It provisions one **free web service** and sets:
   - `ENVIRONMENT=production`
   - `JWT_SECRET` — auto-generated (required outside dev, or the app refuses to boot)
   - `POLLER_ENABLED=true` — the live-price poller (Render has outbound internet)
4. When the build finishes you get **`https://forex-desk-XXXX.onrender.com`**.
   Open it and use the platform as a real user.

Notes for the free tier:

- **Cold starts:** the service sleeps after ~15 min idle; the first request
  after that takes ~30–60s to wake. Subsequent requests are fast.
- **Persistent data:** `render.yaml` provisions a **free Postgres** (`forex-desk-db`)
  and injects `DATABASE_URL`, so accounts / journal / portfolio / layouts survive
  redeploys and sleep. The backend normalizes the `postgresql://` URL to the async
  `asyncpg` driver automatically (`app/db/session.py`). Locally it still defaults to
  SQLite. ⚠️ Render **free-tier Postgres expires ~90 days** after creation — upgrade
  the instance (or recreate it) before then to avoid data loss.
- **No domain needed:** the `*.onrender.com` subdomain is your live URL.

## Run the exact same image locally

```bash
docker build -t forex-desk .
docker run -p 8000:8000 -e JWT_SECRET=$(openssl rand -hex 32) forex-desk
# open http://localhost:8000
```

## Quick temporary public link (no hosting account)

Run the backend locally (it serves the SPA too) and expose it:

```bash
cloudflared tunnel --url http://localhost:8000   # → https://<random>.trycloudflare.com
# or: ngrok http 8000
```
