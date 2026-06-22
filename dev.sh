#!/usr/bin/env bash
#
# dev.sh — launch the Forex Desk backend (FastAPI :8000) and frontend
# (Vite :5173) together with one command. Press Ctrl+C to stop both.
#
#   ./dev.sh
#   → open http://localhost:5173
#
# First run sets up the backend virtualenv and installs dependencies;
# later runs skip straight to launching. Works on macOS, Linux, and
# Windows via Git Bash or WSL.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

command -v python3 >/dev/null 2>&1 || { echo "✗ python3 is required (3.11+)"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "✗ node is required (18+)";    exit 1; }

# ── backend deps ─────────────────────────────────────────────────────────
if [ ! -d "$BACKEND/.venv" ]; then
  echo "› Creating backend virtualenv…"
  python3 -m venv "$BACKEND/.venv"
fi
# shellcheck source=/dev/null
source "$BACKEND/.venv/bin/activate"
if ! python -c "import uvicorn" >/dev/null 2>&1; then
  echo "› Installing backend dependencies…"
  pip install -q -r "$BACKEND/requirements.txt"
fi

# ── frontend deps ────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "› Installing frontend dependencies…"
  (cd "$FRONTEND" && npm install)
fi

# ── launch both; stop both on exit ───────────────────────────────────────
pids=()
cleaned=0
cleanup() {
  [ "$cleaned" = 1 ] && return
  cleaned=1
  echo
  echo "› Shutting down…"
  if [ ${#pids[@]} -gt 0 ]; then
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  fi
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "› Starting backend  → http://localhost:8000"
( cd "$BACKEND" && exec uvicorn app.main:app --port 8000 ) &
pids+=($!)

echo "› Starting frontend → http://localhost:5173"
# Exec vite directly (not via `npm run`, which forks vite as a child and
# would leave it orphaned when we signal the wrapper on shutdown).
( cd "$FRONTEND" && exec ./node_modules/.bin/vite --port 5173 ) &
pids+=($!)

echo
echo "  ┌────────────────────────────────────────────┐"
echo "  │  Forex Desk → http://localhost:5173          │"
echo "  │  Press Ctrl+C to stop both servers.          │"
echo "  └────────────────────────────────────────────┘"
echo

wait
