"""TOTP 2FA columns on user.

Revision ID: 0008
Revises: 0007
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user", sa.Column("totp_secret", sa.String(), nullable=True))
    op.add_column("user", sa.Column("totp_enabled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user", sa.Column("totp_last_counter", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "totp_last_counter")
    op.drop_column("user", "totp_enabled_at")
    op.drop_column("user", "totp_secret")
