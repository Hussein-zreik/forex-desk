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
- **Schema migrations:** the container runs `alembic upgrade head` before starting
  the server, so every deploy applies pending migrations automatically. Outside dev
  Alembic owns the schema (`create_all` runs only when `ENVIRONMENT=dev`); the
  baseline migration is idempotent, so a database created before Alembic existed
  converges without a manual stamp. Adding a model change? Generate a migration
  (`cd backend && alembic revision --autogenerate -m "..."`) — CI fails if the head
  schema drifts from the models (`tests/test_migrations.py`).

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

## Production checklist (the paid step — everything here is optional until launch)

The app runs 100% functional on the free tier; these upgrades remove the free-tier
sharp edges. All code paths are env-gated: nothing below requires a code change.

1. **Kill cold starts** — `render.yaml`: web `plan: free` → `starter` (~$7/mo).
   The free instance sleeps after ~15 min idle; the first request then takes
   30–60 s, which is fatal for a trading tool.
2. **Durable Postgres** — db `plan: free` → `basic-256mb` (~$6/mo). Removes the
   **90-day free-Postgres expiry** (data loss!) and adds point-in-time recovery.
   Keep `numInstances: 1` — the auth rate limiter and poller state are
   process-local by design.
3. **Custom domain** (~$12/yr) — Render dashboard → service → Settings → Custom
   Domains; add the CNAME at your registrar; TLS is automatic. Then set
   `PUBLIC_BASE_URL=https://yourdomain.com` (emailed links, Telegram webhook,
   prerendered canonical/OG URLs all use it) and redeploy so the prerender bakes
   the right URLs.
4. **Error tracking** (free tier) — create a Sentry project, set `SENTRY_DSN`
   (backend) and `VITE_SENTRY_DSN` (frontend build). Both are no-ops when unset.
5. **Uptime monitoring** (free) — point UptimeRobot (or similar) at
   `https://<app>/health` (already the Render health check), 5-min interval,
   alert on 2 consecutive failures.
6. **Backups & restore drill** — paid Render Postgres has point-in-time recovery;
   still rehearse a manual round-trip once:

   ```bash
   # Render dashboard → forex-desk-db → "External Connection String"
   pg_dump "$EXTERNAL_URL" -Fc -f forex-desk-$(date +%F).dump   # backup
   pg_restore --clean --no-owner -d "$RESTORE_URL" forex-desk-*.dump  # restore
   ```

   Verify after restore: log in, journal entries present, `alembic_version` row
   matches head. Automate weekly dumps with any cron runner if you want belt +
   suspenders beyond PITR.

Rough steady-state cost: **~$13/mo + domain**, before any licensed-data upgrade
(`MARKET_PROVIDER=twelvedata` runs on Twelve Data's free tier; their paid tiers
start ~$29/mo when you need more than 800 requests/day).
