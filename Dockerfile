# Forex Desk — single-service image: FastAPI serves both the API and the built
# React app from one origin (one URL, no CORS, no separate frontend host).
#
#   docker build -t forex-desk .
#   docker run -p 8000:8000 -e JWT_SECRET=$(openssl rand -hex 32) forex-desk
#   → open http://localhost:8000

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Empty API base ⇒ the app calls /api and /ws on its own origin (the backend
# below). Must be set at build time; Vite inlines it into the bundle.
ENV VITE_API_URL=""
RUN npm run build

# ---- Stage 2: backend + bundled frontend ----
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
# The built SPA lands in backend/static, which app.main serves when present.
COPY --from=frontend /app/frontend/dist ./static

# Hosts (Render, etc.) inject the port via $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
