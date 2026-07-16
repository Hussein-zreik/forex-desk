"""Journal tags: free-form comma-separated labels on entries.

Revision ID: 0005
Revises: 0004
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "journal_entry",
        sa.Column("tags", sa.String(), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("journal_entry", "tags")
