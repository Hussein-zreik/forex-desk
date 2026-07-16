"""Baseline — the schema as originally created by Base.metadata.create_all.

Idempotent on purpose: the production database already has these tables (they
were created by `create_all` before Alembic existed), so every create is
guarded by an existence check. Fresh databases and the live one both converge
to the same head without a manual `alembic stamp`.

Revision ID: 0001
Revises:
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())

    if "user" not in existing:
        op.create_table(
            "user",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("theme", sa.String(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_user_email", "user", ["email"], unique=True)

    if "quote_cache" not in existing:
        op.create_table(
            "quote_cache",
            sa.Column("symbol", sa.String(), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("symbol"),
        )

    if "data_cache" not in existing:
        op.create_table(
            "data_cache",
            sa.Column("key", sa.String(), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("key"),
        )

    if "dashboard_layout" not in existing:
        op.create_table(
            "dashboard_layout",
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("layouts", sa.JSON(), nullable=False),
            sa.Column("widgets", sa.JSON(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("user_id"),
        )

    if "eco_surprise" not in existing:
        op.create_table(
            "eco_surprise",
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("currency", sa.String(), nullable=False),
            sa.Column("beats", sa.Integer(), nullable=False),
            sa.Column("misses", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("user_id", "currency"),
        )

    if "price_alert" not in existing:
        op.create_table(
            "price_alert",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("symbol", sa.String(), nullable=False),
            sa.Column("condition", sa.String(), nullable=False),
            sa.Column("level", sa.Float(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_price_alert_user_id", "price_alert", ["user_id"])

    if "position" not in existing:
        op.create_table(
            "position",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("symbol", sa.String(), nullable=False),
            sa.Column("side", sa.String(), nullable=False),
            sa.Column("size", sa.Float(), nullable=False),
            sa.Column("entry_price", sa.Float(), nullable=False),
            sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_position_user_id", "position", ["user_id"])

    if "journal_entry" not in existing:
        op.create_table(
            "journal_entry",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("symbol", sa.String(), nullable=False),
            sa.Column("direction", sa.String(), nullable=False),
            sa.Column("pnl", sa.Float(), nullable=False),
            sa.Column("traded_on", sa.String(), nullable=False),
            sa.Column("session", sa.String(), nullable=False),
            sa.Column("mistake", sa.String(), nullable=False),
            sa.Column("notes", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_journal_entry_user_id", "journal_entry", ["user_id"])


def downgrade() -> None:
    # Baseline: dropping everything is the only meaningful downgrade.
    for table in (
        "journal_entry",
        "position",
        "price_alert",
        "eco_surprise",
        "dashboard_layout",
        "data_cache",
        "quote_cache",
        "user",
    ):
        op.drop_table(table)
