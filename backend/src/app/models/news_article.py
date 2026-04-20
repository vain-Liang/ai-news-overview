from __future__ import annotations

from datetime import datetime  # noqa: TC003

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column  # noqa: TC002

from app.models.base import Base


class NewsArticleRecord(Base):
    __tablename__ = "news_article"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    url: Mapped[str] = mapped_column(String(2048), unique=True, index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    author: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    published_at_raw: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    crawled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
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
