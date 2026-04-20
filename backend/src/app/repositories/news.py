from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import desc, func, select
from sqlalchemy.dialects.postgresql import insert

from app.models.news_article import NewsArticleRecord

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.crawlers.schemas import NewsArticle


async def upsert_news_metadata(session: AsyncSession, articles: list[NewsArticle]) -> int:
    if not articles:
        return 0

    rows: list[dict[str, Any]] = []
    for article in articles:
        rows.append(
            {
                "id": article.id,
                "url": article.url,
                "source": article.source,
                "title": article.title,
                "summary": article.summary,
                "author": article.author,
                "published_at_raw": article.published_at,
                "crawled_at": datetime.fromisoformat(article.crawled_at),
            }
        )

    statement = insert(NewsArticleRecord).values(rows)
    statement = statement.on_conflict_do_update(
        index_elements=[NewsArticleRecord.url],
        set_={
            "id": statement.excluded.id,
            "source": statement.excluded.source,
            "title": statement.excluded.title,
            "summary": statement.excluded.summary,
            "author": statement.excluded.author,
            "published_at_raw": statement.excluded.published_at_raw,
            "crawled_at": statement.excluded.crawled_at,
            "updated_at": func.now(),
        },
    )
    await session.execute(statement)
    await session.commit()
    return len(rows)


async def get_news_articles_by_ids(session: AsyncSession, ids: list[str]) -> dict[str, NewsArticleRecord]:
    if not ids:
        return {}
    records = await session.scalars(select(NewsArticleRecord).where(NewsArticleRecord.id.in_(ids)))
    return {record.id: record for record in records}


async def list_latest_news_by_source(
    session: AsyncSession,
    *,
    sources: list[str],
    limit_per_source: int,
) -> dict[str, list[NewsArticleRecord]]:
    grouped_records: dict[str, list[NewsArticleRecord]] = {}

    for source in sources:
        records = await session.scalars(
            select(NewsArticleRecord)
            .where(NewsArticleRecord.source == source)
            .order_by(
                desc(NewsArticleRecord.crawled_at),
                desc(NewsArticleRecord.updated_at),
                desc(NewsArticleRecord.created_at),
            )
            .limit(limit_per_source)
        )
        grouped_records[source] = list(records)

    return grouped_records
