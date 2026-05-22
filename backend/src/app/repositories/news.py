from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import and_, desc, func, select, update
from sqlalchemy.dialects.postgresql import insert

from app.models.news_article import NewsArticleRecord
from app.models.workflow_news_summary import WorkflowNewsSummaryRecord

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


async def upsert_workflow_news_snapshot(
    session: AsyncSession,
    *,
    workflow_task_id: str,
    articles: list[dict[str, Any]],
) -> WorkflowNewsSummaryRecord:
    normalized_articles = [dict(article) for article in articles]
    sources = sorted({str(article.get("source", "")).strip() for article in normalized_articles if article.get("source")})

    statement = insert(WorkflowNewsSummaryRecord).values(
        workflow_task_id=workflow_task_id,
        sources=sources,
        article_count=len(normalized_articles),
        articles=normalized_articles,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[WorkflowNewsSummaryRecord.workflow_task_id],
        set_={
            "sources": statement.excluded.sources,
            "article_count": statement.excluded.article_count,
            "articles": statement.excluded.articles,
            "summary": "",
            "provider": "",
            "summary_task_id": None,
            "summary_generated_at": None,
            "updated_at": func.now(),
        },
    )
    await session.execute(statement)
    await session.commit()
    record = await session.get(WorkflowNewsSummaryRecord, workflow_task_id)
    if record is None:
        raise RuntimeError(f"Failed to persist workflow news snapshot for {workflow_task_id}")
    return record


async def get_workflow_news_summary(
    session: AsyncSession,
    workflow_task_id: str,
) -> WorkflowNewsSummaryRecord | None:
    return await session.get(WorkflowNewsSummaryRecord, workflow_task_id)


async def set_workflow_summary_task(
    session: AsyncSession,
    *,
    workflow_task_id: str,
    summary_task_id: str,
) -> WorkflowNewsSummaryRecord | None:
    await session.execute(
        update(WorkflowNewsSummaryRecord)
        .where(WorkflowNewsSummaryRecord.workflow_task_id == workflow_task_id)
        .values(summary_task_id=summary_task_id, updated_at=func.now())
    )
    await session.commit()
    return await get_workflow_news_summary(session, workflow_task_id)


async def save_workflow_news_summary(
    session: AsyncSession,
    *,
    workflow_task_id: str,
    summary: str,
    provider: str,
    summary_task_id: str | None = None,
) -> WorkflowNewsSummaryRecord | None:
    values: dict[str, Any] = {
        "summary": summary,
        "provider": provider,
        "summary_generated_at": datetime.now(UTC),
        "updated_at": func.now(),
    }
    if summary_task_id is not None:
        values["summary_task_id"] = summary_task_id

    await session.execute(
        update(WorkflowNewsSummaryRecord)
        .where(WorkflowNewsSummaryRecord.workflow_task_id == workflow_task_id)
        .values(**values)
    )
    await session.commit()
    return await get_workflow_news_summary(session, workflow_task_id)


async def list_workflow_summaries(
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    has_summary: bool | None = None,
    source: str | None = None,
) -> tuple[list[WorkflowNewsSummaryRecord], int]:
    filters: list[Any] = []

    if has_summary is True:
        filters.append(WorkflowNewsSummaryRecord.summary_generated_at.is_not(None))
    elif has_summary is False:
        filters.append(WorkflowNewsSummaryRecord.summary_generated_at.is_(None))

    if source:
        filters.append(WorkflowNewsSummaryRecord.sources.contains([source]))

    base_statement = select(WorkflowNewsSummaryRecord)
    if filters:
        base_statement = base_statement.where(and_(*filters))

    total_statement = select(func.count(WorkflowNewsSummaryRecord.workflow_task_id))
    if filters:
        total_statement = total_statement.where(and_(*filters))

    total_count = int((await session.execute(total_statement)).scalar_one() or 0)

    statement = (
        base_statement.order_by(WorkflowNewsSummaryRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    rows = list((await session.execute(statement)).scalars().all())
    return rows, total_count


async def get_workflow_summary_counts(
    session: AsyncSession,
) -> tuple[int, int, datetime | None]:
    total_statement = select(func.count(WorkflowNewsSummaryRecord.workflow_task_id))
    total = int((await session.execute(total_statement)).scalar_one() or 0)

    with_summary_statement = select(
        func.count(WorkflowNewsSummaryRecord.workflow_task_id)
    ).where(WorkflowNewsSummaryRecord.summary_generated_at.is_not(None))
    with_summary = int((await session.execute(with_summary_statement)).scalar_one() or 0)

    latest_statement = select(WorkflowNewsSummaryRecord.created_at).order_by(
        WorkflowNewsSummaryRecord.created_at.desc()
    )
    latest = await session.scalar(latest_statement)

    return total, with_summary, latest
