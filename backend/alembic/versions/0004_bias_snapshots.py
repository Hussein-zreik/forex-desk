"""Bias track record: hourly composite snapshots graded against price moves.

Revision ID: 0004
Revises: 0003
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "bias_snapshot",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("bucket", sa.String(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("signals", sa.JSON(), nullable=False),
        sa.Column("price_at", sa.Float(), nullable=False),
        sa.Column("price_1d", sa.Float(), nullable=True),
        sa.Column("price_1w", sa.Float(), nullable=True),
        sa.Column("outcome_1d", sa.String(), nullable=True),
        sa.Column("outcome_1w", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("symbol", "bucket", name="uq_bias_snapshot_symbol_bucket"),
    )
    op.create_index("ix_bias_snapshot_symbol", "bias_snapshot", ["symbol"])


def downgrade() -> None:
    op.drop_table("bias_snapshot")
