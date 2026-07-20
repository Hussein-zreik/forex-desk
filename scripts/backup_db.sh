#!/usr/bin/env sh
# Weekly Postgres backup → S3-compatible object storage.
#
# Env-gated (project philosophy): a no-op that exits 0 until BACKUP_S3_BUCKET
# is set, so the Render cron can be enabled before storage is configured
# without failing. When configured it uploads a compressed pg_dump named by
# UTC date. Works with any S3-compatible store (AWS S3, Backblaze B2,
# Cloudflare R2, MinIO) via the standard AWS_* credentials + an optional
# endpoint override.
#
# Required to activate:
#   DATABASE_URL         Postgres connection string (Render injects this)
#   BACKUP_S3_BUCKET     destination bucket name
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY   storage credentials
# Optional:
#   BACKUP_S3_ENDPOINT   custom endpoint URL (B2 / R2 / MinIO); omit for AWS
#   BACKUP_S3_PREFIX     key prefix (default "forex-desk")
#   AWS_DEFAULT_REGION   region (default "us-east-1")
#
# Retention is delegated to a bucket lifecycle rule (see DEPLOY.md) — the
# script only ever writes.
set -eu

log() { echo "[backup] $1"; }

if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
  log "BACKUP_S3_BUCKET unset — backups not configured, nothing to do."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  log "DATABASE_URL unset — cannot back up. Exiting non-zero so the run is flagged."
  exit 1
fi

prefix="${BACKUP_S3_PREFIX:-forex-desk}"
key="${prefix}/${prefix}-$(date -u +%Y-%m-%dT%H%M%SZ).dump"
dest="s3://${BACKUP_S3_BUCKET}/${key}"

endpoint_args=""
if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
  endpoint_args="--endpoint-url ${BACKUP_S3_ENDPOINT}"
fi

log "dumping database → ${dest}"
# Stream the custom-format dump straight to storage (no large temp file).
# shellcheck disable=SC2086
pg_dump "${DATABASE_URL}" -Fc | aws s3 cp - "${dest}" ${endpoint_args}
log "backup complete: ${key}"
