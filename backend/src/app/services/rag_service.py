from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any

from langchain_core.documents import Document

from app.llm.chains.news_summary import summarize_news_context
from app.services.news_service import semantic_search_news

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.core.config import LlmProvider


@dataclass(slots=True)
class NewsRagSummaryResult:
    query: str
    summary: str
    results: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _result_to_document(result: dict[str, Any]) -> Document:
    page_content = "\n".join(
        part
        for part in [
            f"标题：{result.get('title', '')}",
            f"摘要：{result.get('summary', '')}",
            f"作者：{result.get('author', '')}",
            f"发布时间：{result.get('published_at', '')}",
            f"来源：{result.get('source', '')}",
            f"链接：{result.get('url', '')}",
        ]
        if part.split("：", maxsplit=1)[1]
    )
    return Document(
        id=result.get("id"),
        page_content=page_content,
        metadata={
            "id": result.get("id"),
            "url": result.get("url"),
            "source": result.get("source"),
            "title": result.get("title"),
            "published_at": result.get("published_at"),
            "distance": result.get("distance"),
        },
    )


def _format_context(documents: list[Document]) -> str:
    chunks: list[str] = []
    for index, document in enumerate(documents, start=1):
        metadata = document.metadata
        chunks.append(
            "\n".join(
                [
                    f"[新闻 {index}]",
                    f"标题：{metadata.get('title', '')}",
                    f"来源：{metadata.get('source', '')}",
                    f"发布时间：{metadata.get('published_at', '')}",
                    f"链接：{metadata.get('url', '')}",
                    document.page_content,
                ]
            ).strip()
        )
    return "\n\n".join(chunks)


async def generate_news_rag_summary(
    session: AsyncSession,
    *,
    query: str,
    n_results: int = 6,
    source: str | None = None,
    persist_dir: str | None = None,
    provider: LlmProvider | None = None,
) -> NewsRagSummaryResult:
    results = await semantic_search_news(
        session,
        query=query,
        n_results=n_results,
        source=source,
        persist_dir=persist_dir,
    )
    if not results:
        return NewsRagSummaryResult(
            query=query,
            summary="未检索到相关新闻，无法生成基于数据的摘要。",
            results=[],
        )

    documents = [_result_to_document(result) for result in results]
    context = _format_context(documents)
    summary = await summarize_news_context(query=query, context=context, provider=provider)
    return NewsRagSummaryResult(query=query, summary=summary.strip(), results=results)
