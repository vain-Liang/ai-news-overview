from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa

from alembic import op

if TYPE_CHECKING:
    from collections.abc import Sequence

"""add news article table

Revision ID: 4f6f7a8b9c10
Revises: c2f9008cfbf1
Create Date: 2026-04-19 18:45:00.000000
"""

# revision identifiers, used by Alembic.
revision: str = "4f6f7a8b9c10"
down_revision: str | Sequence[str] | None = "c2f9008cfbf1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "news_article",
        sa.Column("id", sa.String(length=16), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("author", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("published_at_raw", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("crawled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )
    op.create_index(op.f("ix_news_article_source"), "news_article", ["source"], unique=False)
    op.create_index(op.f("ix_news_article_url"), "news_article", ["url"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_news_article_url"), table_name="news_article")
    op.drop_index(op.f("ix_news_article_source"), table_name="news_article")
    op.drop_table("news_article")
