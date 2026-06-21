# Forex Desk — Backend (FastAPI)

Data layer for Forex Desk: proxies upstream market APIs, computes indicators
(server-side), holds secrets, caches in SQL, and serves the frontend over REST + WebSocket.

## Setup

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload   # http://127.0.0.1:8000  (docs at /docs)
```

## Test / lint

```bash
pytest
ruff check .
black --check .
```
