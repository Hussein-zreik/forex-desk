import os
import sqlite3
import tempfile

# Point the app at an isolated temp DB + test secret BEFORE app imports.
_TMP = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_TMP}/test.db")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("POLLER_ENABLED", "false")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _clear_caches() -> None:
    """Wipe cache tables so tests don't share cached upstream responses."""
    path = os.environ["DATABASE_URL"].split(":///")[-1]
    try:
        conn = sqlite3.connect(path)
        for table in ("data_cache", "quote_cache"):
            try:
                conn.execute(f"DELETE FROM {table}")
            except sqlite3.OperationalError:
                pass
        conn.commit()
        conn.close()
    except sqlite3.Error:
        pass


@pytest.fixture()
def client():
    # `with` triggers lifespan → init_db() creates the schema.
    with TestClient(app) as c:
        _clear_caches()
        yield c
