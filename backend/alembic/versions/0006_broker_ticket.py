"""Broker statement import: ticket id on journal entries for dedupe.

Revision ID: 0006
Revises: 0005
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("journal_entry", sa.Column("broker_ticket", sa.String(), nullable=True))
    # Non-unique lookup index: dedupe is enforced app-side per user at import
    # time (portable across SQLite dev / Postgres prod; single-instance deploy
    # makes a race practically impossible).
    op.create_index("ix_journal_entry_broker_ticket", "journal_entry", ["broker_ticket"])


def downgrade() -> None:
    op.drop_index("ix_journal_entry_broker_ticket", table_name="journal_entry")
    op.drop_column("journal_entry", "broker_ticket")
