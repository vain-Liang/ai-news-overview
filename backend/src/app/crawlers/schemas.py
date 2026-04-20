from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class NewsArticle:
    id: str  # sha256 hex of url
    url: str
    source: str  # site name key e.g. "xinhua"
    title: str
    summary: str
    author: str
    published_at: str  # raw string from page, may be empty
    crawled_at: str  # ISO datetime string
    tags: list[str] = field(default_factory=list)
