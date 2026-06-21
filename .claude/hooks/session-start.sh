#!/bin/bash
# Forex Desk — SessionStart hook
# Installs frontend + backend dependencies so tests and linters work in
# Claude Code on the web. Synchronous, idempotent, web-only.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT"

echo "[session-start] Installing frontend dependencies (npm)..."
npm install --prefix frontend

echo "[session-start] Setting up backend virtualenv (pip)..."
if [ ! -d backend/.venv ]; then
  python3 -m venv backend/.venv
fi
backend/.venv/bin/python -m pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements-dev.txt

echo "[session-start] Dependencies ready."
