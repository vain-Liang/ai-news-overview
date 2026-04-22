from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa

from alembic import op

if TYPE_CHECKING:
    from collections.abc import Sequence

"""add pending email column to user

Revision ID: 8d3b2f1e9a4c
Revises: 4f6f7a8b9c10
Create Date: 2026-04-21 19:30:00.000000
"""

# revision identifiers, used by Alembic.
revision: str = "8d3b2f1e9a4c"
down_revision: str | Sequence[str] | None = "4f6f7a8b9c10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("user", sa.Column("pending_email", sa.String(length=320), nullable=True))
    op.create_index(op.f("ix_user_pending_email"), "user", ["pending_email"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_user_pending_email"), table_name="user")
    op.drop_column("user", "pending_email")
