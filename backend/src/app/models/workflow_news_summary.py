from __future__ import annotations

from datetime import datetime  # noqa: TC003

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column  # noqa: TC002

from app.models.base import Base


class WorkflowNewsSummaryRecord(Base):
    __tablename__ = "workflow_news_summary"

    workflow_task_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    summary_task_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    provider: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    sources: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    article_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    articles: Mapped[list[dict[str, object]]] = mapped_column(JSONB, default=list, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    summary_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
