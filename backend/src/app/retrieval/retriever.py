from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.vectorstore.base import SearchResult, VectorStoreBase


def semantic_search(
    query: str,
    store: VectorStoreBase,
    n_results: int = 10,
    source: str | None = None,
) -> list[SearchResult]:
    return store.search_articles(query=query, n_results=n_results, source=source)
