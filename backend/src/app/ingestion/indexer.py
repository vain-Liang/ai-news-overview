from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from langchain_core.documents import Document

    from app.vectorstore.base import VectorStoreBase


def index_documents(documents: list[Document], store: VectorStoreBase) -> int:
    if not documents:
        return 0
    articles = [
        {
            "id": doc.metadata["id"],
            "url": doc.metadata["url"],
            "source": doc.metadata["source"],
            "title": doc.page_content.split("\n\n")[0],
            "summary": "\n\n".join(doc.page_content.split("\n\n")[1:]) or None,
            "author": doc.metadata.get("author") or None,
            "published_at_raw": doc.metadata.get("published_at") or None,
            "crawled_at": doc.metadata.get("crawled_at", ""),
        }
        for doc in documents
    ]
    store.store_articles(articles)
    return len(documents)
