from __future__ import annotations

import asyncio
import logging
from dataclasses import asdict, dataclass, replace
from typing import TYPE_CHECKING, Any

from app.crawlers.extractors import SITE_CONFIGS
from app.crawlers.news_crawler import crawl_all_sites
from app.ingestion.pipeline import ingest_articles
from app.llm.chains.article_summary import summarize_article
from app.repositories.news import (
    get_news_articles_by_ids,
    list_latest_news_by_source,
    upsert_news_metadata,
)
from app.retrieval.retriever import semantic_search
from app.vectorstore.factory import build_vector_store, get_vector_store

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.crawlers.schemas import NewsArticle
    from app.models.news_article import NewsArticleRecord
    from app.vectorstore.base import VectorStoreBase

logger = logging.getLogger(__name__)

_SUMMARY_CONCURRENCY = 5


@dataclass(slots=True)
class NewsIngestionResult:
    crawled_count: int
    metadata_stored_count: int
    vector_stored_count: int
    by_source: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


async def _enrich_articles_with_summaries(articles: list[NewsArticle]) -> list[NewsArticle]:
    sem = asyncio.Semaphore(_SUMMARY_CONCURRENCY)

    async def _enrich(article: NewsArticle) -> NewsArticle:
        async with sem:
            try:
                summary = await summarize_article(title=article.title, raw_summary=article.summary)
                return replace(article, summary=summary.strip())
            except Exception:
                logger.warning("Failed to generate LLM summary for article %s, keeping original", article.id)
                return article

    return list(await asyncio.gather(*[_enrich(a) for a in articles]))


def _record_to_news_result(record: NewsArticleRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "url": record.url,
        "source": record.source,
        "title": record.title,
        "summary": record.summary,
        "author": record.author,
        "published_at": record.published_at_raw,
        "crawled_at": record.crawled_at.isoformat(),
        "distance": None,
    }


def _resolve_store(persist_dir: str | None) -> VectorStoreBase:
    if persist_dir is None:
        return get_vector_store()
    return build_vector_store(persist_dir=persist_dir)


async def ingest_homepage_news(
    session: AsyncSession,
    *,
    sources: list[str] | None = None,
    bypass_cache: bool = True,
    persist_dir: str | None = None,
) -> NewsIngestionResult:
    articles = await crawl_all_sites(sources=sources, bypass_cache=bypass_cache)
    articles = await _enrich_articles_with_summaries(articles)
    metadata_stored_count = await upsert_news_metadata(session, articles)
    store = _resolve_store(persist_dir)
    vector_stored_count = ingest_articles(articles, store)

    by_source: dict[str, int] = {}
    for article in articles:
        by_source[article.source] = by_source.get(article.source, 0) + 1

    return NewsIngestionResult(
        crawled_count=len(articles),
        metadata_stored_count=metadata_stored_count,
        vector_stored_count=vector_stored_count,
        by_source=by_source,
    )


async def semantic_search_news(
    session: AsyncSession,
    *,
    query: str,
    n_results: int = 10,
    source: str | None = None,
    persist_dir: str | None = None,
) -> list[dict[str, Any]]:
    store = _resolve_store(persist_dir)
    matches = semantic_search(query, store, n_results=n_results, source=source)
    records = await get_news_articles_by_ids(session, [match.id for match in matches])

    enriched: list[dict[str, Any]] = []
    for match in matches:
        record = records.get(match.id)
        metadata = match.metadata
        if record is None:
            enriched.append(
                {
                    "id": match.id,
                    "url": metadata.get("url"),
                    "source": metadata.get("source"),
                    "title": metadata.get("title"),
                    "summary": metadata.get("summary", ""),
                    "author": metadata.get("author", ""),
                    "published_at": metadata.get("published_at", ""),
                    "crawled_at": metadata.get("crawled_at"),
                    "distance": match.distance,
                }
            )
            continue
        enriched.append(
            {
                **_record_to_news_result(record),
                "distance": match.distance,
            }
        )
    return enriched


async def list_homepage_news(
    session: AsyncSession,
    *,
    per_source: int = 8,
) -> list[dict[str, Any]]:
    source_order = list(SITE_CONFIGS)
    grouped_records = await list_latest_news_by_source(
        session,
        sources=source_order,
        limit_per_source=per_source,
    )

    return [
        {
            "source": source,
            "articles": [_record_to_news_result(record) for record in grouped_records.get(source, [])],
        }
        for source in source_order
    ]
