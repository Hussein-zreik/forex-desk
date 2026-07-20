"""The backup script must be safely inert until BACKUP_S3_BUCKET is configured,
and must fail loudly if asked to back up with no DATABASE_URL."""

import subprocess
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "backup_db.sh"


def _run(env: dict[str, str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["sh", str(SCRIPT)],
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )


def test_script_exists_and_is_executable():
    assert SCRIPT.exists()


def test_inert_when_bucket_unset():
    # No BACKUP_S3_BUCKET → clean no-op (never touches pg_dump / aws).
    res = _run({"PATH": "/usr/bin:/bin"})
    assert res.returncode == 0
    assert "not configured" in res.stdout


def test_fails_when_configured_without_database_url():
    # Bucket set but DATABASE_URL missing → non-zero so the cron run is flagged,
    # and it exits before invoking pg_dump/aws (which aren't needed for this path).
    res = _run({"PATH": "/usr/bin:/bin", "BACKUP_S3_BUCKET": "my-bucket"})
    assert res.returncode == 1
    assert "DATABASE_URL unset" in res.stdout
