from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.vectorstore.base import SearchResult, VectorStoreBase


def _build_query(query: str, topics: list[str] | None) -> str:
    """Inject topic keywords into the embedding query for better semantic recall."""
    if not topics:
        return query
    topic_clause = " ".join(topics)
    return f"{query} {topic_clause}".strip()


def semantic_search(
    query: str,
    store: VectorStoreBase,
    n_results: int = 10,
    source: str | None = None,
    topics: list[str] | None = None,
) -> list[SearchResult]:
    enriched_query = _build_query(query, topics)
    return store.search_articles(query=enriched_query, n_results=n_results, source=source, topics=topics)
