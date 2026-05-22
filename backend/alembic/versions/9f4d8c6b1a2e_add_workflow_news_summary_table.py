"""add workflow news summary table

Revision ID: 9f4d8c6b1a2e
Revises: 8d3b2f1e9a4c
Create Date: 2026-05-09 19:30:00.000000

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9f4d8c6b1a2e"
down_revision: Union[str, Sequence[str], None] = "8d3b2f1e9a4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workflow_news_summary",
        sa.Column("workflow_task_id", sa.String(length=128), nullable=False),
        sa.Column("summary_task_id", sa.String(length=128), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("sources", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("article_count", sa.Integer(), nullable=False),
        sa.Column("articles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("summary_generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("workflow_task_id"),
    )
    op.create_index(op.f("ix_workflow_news_summary_summary_task_id"), "workflow_news_summary", ["summary_task_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_workflow_news_summary_summary_task_id"), table_name="workflow_news_summary")
    op.drop_table("workflow_news_summary")
