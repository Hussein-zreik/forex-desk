# Forex Desk API — FastAPI + Uvicorn
FROM python:3.11-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# SQLite DB is created inside the container on first run (zero setup).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
