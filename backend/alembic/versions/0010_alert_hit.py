"""Alert-hit history table.

Revision ID: 0010
Revises: 0009
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "alert_hit",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("alert_id", sa.String(), nullable=True),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("condition", sa.String(), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("fired_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alert_hit_user_id", "alert_hit", ["user_id"])
    op.create_index("ix_alert_hit_fired_at", "alert_hit", ["fired_at"])


def downgrade() -> None:
    op.drop_index("ix_alert_hit_fired_at", table_name="alert_hit")
    op.drop_index("ix_alert_hit_user_id", table_name="alert_hit")
    op.drop_table("alert_hit")
