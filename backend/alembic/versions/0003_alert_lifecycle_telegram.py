"""Alert lifecycle fields + per-user Telegram chat id.

Revision ID: 0003
Revises: 0002
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user", sa.Column("telegram_chat_id", sa.String(), nullable=True))

    op.add_column(
        "price_alert", sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("price_alert", sa.Column("triggered_price", sa.Float(), nullable=True))
    # Server defaults backfill existing rows, then match the model's python-side defaults.
    op.add_column(
        "price_alert",
        sa.Column("seen", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "price_alert",
        sa.Column("notify_email", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("price_alert", "notify_email")
    op.drop_column("price_alert", "seen")
    op.drop_column("price_alert", "triggered_price")
    op.drop_column("price_alert", "triggered_at")
    op.drop_column("user", "telegram_chat_id")
