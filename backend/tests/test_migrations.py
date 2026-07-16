"""Migration integrity: Alembic owns the schema, so head must equal the models."""

import tempfile
from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, inspect

from alembic import command
from app.db.base import Base

_BACKEND = Path(__file__).resolve().parents[1]


def _alembic_config(db_path: str) -> Config:
    cfg = Config(str(_BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(_BACKEND / "alembic"))
    cfg.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")
    return cfg


def _schema(db_path: str) -> set[tuple[str, str]]:
    """The (table, column) pairs of a database, ignoring alembic bookkeeping."""
    engine = create_engine(f"sqlite:///{db_path}")
    try:
        inspector = inspect(engine)
        return {
            (table, col["name"])
            for table in inspector.get_table_names()
            if table != "alembic_version"
            for col in inspector.get_columns(table)
        }
    finally:
        engine.dispose()


def _model_schema() -> set[tuple[str, str]]:
    import app.models  # noqa: F401  (register models)

    return {
        (table.name, column.name)
        for table in Base.metadata.sorted_tables
        for column in table.columns
    }


def test_upgrade_head_matches_models():
    """A fresh `alembic upgrade head` must produce exactly the model schema.

    This is the guard that keeps every future model change honest: add a
    column without a migration and this fails in CI.
    """
    with tempfile.TemporaryDirectory() as tmp:
        db = f"{tmp}/fresh.db"
        command.upgrade(_alembic_config(db), "head")
        assert _schema(db) == _model_schema()


def test_baseline_is_idempotent_on_existing_schema():
    """Upgrading a DB that create_all already populated must not error.

    This is the live-Render path: the prod database predates Alembic, so the
    baseline skips tables that already exist and still stamps the revision.
    """
    with tempfile.TemporaryDirectory() as tmp:
        db = f"{tmp}/existing.db"
        import app.models  # noqa: F401

        engine = create_engine(f"sqlite:///{db}")
        Base.metadata.create_all(engine)
        engine.dispose()

        command.upgrade(_alembic_config(db), "head")  # must not raise
        assert _schema(db) == _model_schema()

        # And the revision is stamped, so the next deploy is a no-op.
        engine = create_engine(f"sqlite:///{db}")
        assert "alembic_version" in inspect(engine).get_table_names()
        engine.dispose()


def test_upgrade_head_twice_is_noop():
    with tempfile.TemporaryDirectory() as tmp:
        db = f"{tmp}/twice.db"
        cfg = _alembic_config(db)
        command.upgrade(cfg, "head")
        command.upgrade(cfg, "head")  # must not raise
        assert _schema(db) == _model_schema()
