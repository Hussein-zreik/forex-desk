import os
import tempfile

# Point the app at an isolated temp DB + test secret BEFORE app imports.
_TMP = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_TMP}/test.db")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("POLLER_ENABLED", "false")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    # `with` triggers lifespan → init_db() creates the schema.
    with TestClient(app) as c:
        yield c
