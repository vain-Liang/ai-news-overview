from __future__ import annotations

from typing import TYPE_CHECKING

from langchain_core.documents import Document

if TYPE_CHECKING:
    from app.crawlers.schemas import NewsArticle


def articles_to_documents(articles: list[NewsArticle]) -> list[Document]:
    return [
        Document(
            page_content=f"{a.title}\n\n{a.summary}" if a.summary else a.title,
            metadata={
                "id": a.id,
                "url": a.url,
                "source": a.source,
                "author": a.author or "",
                "published_at": a.published_at or "",
                "crawled_at": a.crawled_at,
            },
        )
        for a in articles
    ]
