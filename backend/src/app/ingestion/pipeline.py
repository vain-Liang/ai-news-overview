from __future__ import annotations

from typing import TYPE_CHECKING

from app.ingestion.indexer import index_documents
from app.ingestion.loader import articles_to_documents
from app.ingestion.splitter import split_documents

if TYPE_CHECKING:
    from app.crawlers.schemas import NewsArticle
    from app.vectorstore.base import VectorStoreBase


def ingest_articles(articles: list[NewsArticle], store: VectorStoreBase) -> int:
    docs = articles_to_documents(articles)
    docs = split_documents(docs)
    return index_documents(docs, store)
