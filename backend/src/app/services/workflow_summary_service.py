from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any

from app.core.config import get_settings
from app.crawlers.schemas import NewsArticle
from app.llm.chains.news_summary import summarize_news_context
from app.repositories.news import (
    get_workflow_news_summary,
    save_workflow_news_summary,
    upsert_workflow_news_snapshot,
)

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.core.config import LlmProvider
    from app.models.workflow_news_summary import WorkflowNewsSummaryRecord

_WORKFLOW_SUMMARY_QUERY = "请基于本次工作流抓取到的新闻标题与原始摘要（如有），生成一份准确、克制、可追溯的中文总结。"


@dataclass(slots=True)
class WorkflowNewsSummaryResult:
    workflow_task_id: str
    summary_task_id: str | None
    article_count: int
    sources: list[str]
    summary: str
    provider: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _normalize_article(article: NewsArticle | Mapping[str, Any]) -> dict[str, Any]:
    if isinstance(article, NewsArticle):
        return {
            "id": article.id,
            "url": article.url,
            "source": article.source,
            "title": article.title,
            "summary": article.summary,
            "author": article.author,
            "published_at": article.published_at,
            "crawled_at": article.crawled_at,
            "tags": list(article.tags),
        }

    return {
        "id": str(article.get("id") or ""),
        "url": str(article.get("url") or ""),
        "source": str(article.get("source") or ""),
        "title": str(article.get("title") or ""),
        "summary": str(article.get("summary") or ""),
        "author": str(article.get("author") or ""),
        "published_at": str(article.get("published_at") or article.get("published_at_raw") or ""),
        "crawled_at": str(article.get("crawled_at") or ""),
        "tags": list(article.get("tags") or []),
    }


def serialize_workflow_articles(articles: Iterable[NewsArticle | Mapping[str, Any]]) -> list[dict[str, Any]]:
    return [_normalize_article(article) for article in articles]


def _format_workflow_context(articles: list[dict[str, Any]]) -> str:
    chunks: list[str] = []
    for index, article in enumerate(articles, start=1):
        lines = [
            f"[新闻 {index}]",
            f"标题：{article.get('title', '')}",
            f"原始摘要：{article.get('summary', '')}",
            f"作者：{article.get('author', '')}",
            f"发布时间：{article.get('published_at', '')}",
            f"来源：{article.get('source', '')}",
            f"链接：{article.get('url', '')}",
        ]
        filtered_lines: list[str] = []
        for line in lines:
            if line.startswith("["):
                filtered_lines.append(line)
                continue
            _, _, value = line.partition("：")
            if value:
                filtered_lines.append(line)
        chunks.append("\n".join(filtered_lines))
    return "\n\n".join(chunks)


def _result_from_record(record: WorkflowNewsSummaryRecord) -> WorkflowNewsSummaryResult:
    return WorkflowNewsSummaryResult(
        workflow_task_id=record.workflow_task_id,
        summary_task_id=record.summary_task_id,
        article_count=record.article_count,
        sources=list(record.sources),
        summary=record.summary,
        provider=record.provider,
    )


async def register_workflow_news_snapshot(
    session: AsyncSession,
    *,
    workflow_task_id: str,
    articles: Iterable[NewsArticle | Mapping[str, Any]],
) -> WorkflowNewsSummaryResult:
    record = await upsert_workflow_news_snapshot(
        session,
        workflow_task_id=workflow_task_id,
        articles=serialize_workflow_articles(articles),
    )
    return _result_from_record(record)


async def generate_workflow_news_summary(
    session: AsyncSession,
    *,
    workflow_task_id: str,
    provider: LlmProvider | None = None,
    summary_task_id: str | None = None,
) -> WorkflowNewsSummaryResult:
    record = await get_workflow_news_summary(session, workflow_task_id)
    if record is None:
        raise ValueError(f"No stored workflow news found for task_id={workflow_task_id}")

    articles = [dict(article) for article in record.articles]
    if not articles:
        summary = "本次工作流没有抓取到可用于摘要的新闻。"
    else:
        context = _format_workflow_context(articles)
        summary = (await summarize_news_context(query=_WORKFLOW_SUMMARY_QUERY, context=context, provider=provider)).strip()

    effective_provider = provider or get_settings().llm_provider
    updated_record = await save_workflow_news_summary(
        session,
        workflow_task_id=workflow_task_id,
        summary=summary,
        provider=effective_provider,
        summary_task_id=summary_task_id,
    )
    if updated_record is None:
        raise RuntimeError(f"Failed to store workflow news summary for {workflow_task_id}")
    return _result_from_record(updated_record)
