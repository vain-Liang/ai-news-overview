from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any, TypeAlias, cast

import chromadb
from chromadb.config import Settings

from app.vectorstore.base import SearchResult, VectorStoreBase

if TYPE_CHECKING:
    from app.crawlers.schemas import NewsArticle

logger = logging.getLogger(__name__)

MetadataValue: TypeAlias = str | int | float | bool | list[str | int | float | bool] | None  # noqa: UP040

_clients: dict[str, chromadb.ClientAPI] = {}


def _resolve_persist_dir(persist_dir: str | None) -> str:
    if persist_dir:
        resolved = Path(persist_dir).resolve()
    else:
        from app.core.config import get_settings

        resolved = Path(get_settings().chroma_persist_dir).resolve()
    resolved.mkdir(parents=True, exist_ok=True)
    return str(resolved)


def _resolve_collection_name(collection_name: str | None) -> str:
    if collection_name:
        return collection_name
    from app.core.config import get_settings

    return get_settings().chroma_collection_name


def get_chroma_client(persist_dir: str | None = None) -> chromadb.ClientAPI:
    resolved_dir = _resolve_persist_dir(persist_dir)
    client = _clients.get(resolved_dir)
    if client is None:
        client = chromadb.PersistentClient(
            path=resolved_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        _clients[resolved_dir] = client
    return client


def get_or_create_collection(
    *,
    persist_dir: str | None = None,
    collection_name: str | None = None,
) -> chromadb.Collection:
    client = get_chroma_client(persist_dir)
    return client.get_or_create_collection(
        name=_resolve_collection_name(collection_name),
        metadata={"hnsw:space": "cosine"},
    )


def _upsert_article_dicts(
    articles: list[dict],
    *,
    persist_dir: str | None = None,
    collection_name: str | None = None,
) -> int:
    if not articles:
        return 0

    collection = get_or_create_collection(persist_dir=persist_dir, collection_name=collection_name)

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, MetadataValue]] = []

    for article in articles:
        title = article.get("title", "") or ""
        summary = article.get("summary") or ""
        document = f"{title}\n{summary}".strip()
        ids.append(article["id"])
        documents.append(document)
        metadatas.append(
            {
                "url": article.get("url"),
                "source": article.get("source"),
                "title": title,
                "author": article.get("author"),
                "published_at": article.get("published_at_raw") or article.get("published_at"),
                "crawled_at": article.get("crawled_at"),
            }
        )

    collection.upsert(ids=ids, documents=documents, metadatas=cast("Any", metadatas))
    logger.info("Stored %d articles in Chroma collection '%s'", len(articles), _resolve_collection_name(collection_name))
    return len(articles)


def store_articles(
    articles: list[NewsArticle],
    *,
    persist_dir: str | None = None,
    collection_name: str | None = None,
) -> int:
    """Upsert articles into Chroma. Returns count of stored articles."""
    if not articles:
        return 0

    payload = [
        {
            "id": article.id,
            "url": article.url,
            "source": article.source,
            "title": article.title,
            "summary": article.summary,
            "author": article.author,
            "published_at_raw": article.published_at,
            "crawled_at": article.crawled_at,
        }
        for article in articles
    ]
    return _upsert_article_dicts(payload, persist_dir=persist_dir, collection_name=collection_name)


def search_articles(
    query: str,
    *,
    n_results: int = 10,
    source: str | None = None,
    persist_dir: str | None = None,
    collection_name: str | None = None,
) -> list[dict]:
    """Semantic search over stored news articles."""
    collection = get_or_create_collection(persist_dir=persist_dir, collection_name=collection_name)
    where = {"source": source} if source else None
    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    output: list[dict] = []
    ids = (results.get("ids") or [[]])[0]
    documents = (results.get("documents") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]
    distances = (results.get("distances") or [[]])[0]
    for doc_id, document, metadata, distance in zip(ids, documents, metadatas, distances, strict=False):
        output.append({"id": doc_id, "text": document, "distance": distance, **(metadata or {})})
    return output


class ChromaVectorStore(VectorStoreBase):
    def __init__(
        self,
        *,
        persist_dir: str | None = None,
        collection_name: str | None = None,
    ) -> None:
        self._persist_dir = persist_dir
        self._collection_name = collection_name

    def store_articles(self, articles: list[dict]) -> None:
        _upsert_article_dicts(
            articles,
            persist_dir=self._persist_dir,
            collection_name=self._collection_name,
        )

    def search_articles(
        self, query: str, n_results: int = 10, source: str | None = None
    ) -> list[SearchResult]:
        raw = search_articles(
            query,
            n_results=n_results,
            source=source,
            persist_dir=self._persist_dir,
            collection_name=self._collection_name,
        )
        results: list[SearchResult] = []
        for item in raw:
            metadata = {k: v for k, v in item.items() if k not in {"id", "text", "distance"}}
            results.append(
                SearchResult(
                    id=item["id"],
                    document=item.get("text", ""),
                    metadata=metadata,
                    distance=item.get("distance", 0.0),
                )
            )
        return results
