from __future__ import annotations

from typing import Any, cast

from app.services.rag_service import generate_news_rag_summary


async def test_generate_news_rag_summary_uses_retrieved_context(monkeypatch) -> None:
    async def fake_search(*_args, **_kwargs) -> list[dict]:
        return [
            {
                "id": "news-1",
                "url": "https://www.news.cn/sample-1",
                "source": "xinhua",
                "title": "中国经济延续回升向好态势",
                "summary": "多个指标显示工业与消费同步改善。",
                "author": "新华社",
                "published_at": "2026-04-19 08:00",
                "crawled_at": "2026-04-19T08:30:00+00:00",
                "distance": 0.11,
            },
            {
                "id": "news-2",
                "url": "https://www.ifeng.com/sample-2",
                "source": "ifeng",
                "title": "多地推出举措提振消费",
                "summary": "地方政策与节庆活动共同拉动消费回暖。",
                "author": "凤凰网",
                "published_at": "2026-04-19 09:00",
                "crawled_at": "2026-04-19T09:10:00+00:00",
                "distance": 0.18,
            },
        ]

    async def fake_summarize_news_context(*, query: str, context: str, provider: str | None = None) -> str:
        assert query == "请总结今日经济新闻"
        assert "中国经济延续回升向好态势" in context
        assert "多地推出举措提振消费" in context
        assert provider is None
        return "总体摘要\n- 要点1\n- 要点2"

    monkeypatch.setattr("app.services.rag_service.semantic_search_news", fake_search)
    monkeypatch.setattr("app.services.rag_service.summarize_news_context", fake_summarize_news_context)

    result = await generate_news_rag_summary(session=cast("Any", None), query="请总结今日经济新闻")

    assert result.query == "请总结今日经济新闻"
    assert "总体摘要" in result.summary
    assert len(result.results) == 2
    assert result.results[0]["source"] == "xinhua"


async def test_generate_news_rag_summary_passes_provider_override(monkeypatch) -> None:
    async def fake_search(*_args, **_kwargs) -> list[dict]:
        return [
            {
                "id": "news-1",
                "url": "https://www.news.cn/sample-1",
                "source": "xinhua",
                "title": "中国经济延续回升向好态势",
                "summary": "多个指标显示工业与消费同步改善。",
                "author": "新华社",
                "published_at": "2026-04-19 08:00",
                "crawled_at": "2026-04-19T08:30:00+00:00",
                "distance": 0.11,
            }
        ]

    async def fake_summarize_news_context(*, query: str, context: str, provider: str | None = None) -> str:
        assert query == "请总结今日经济新闻"
        assert "中国经济延续回升向好态势" in context
        assert provider == "openai"
        return "OpenAI 摘要"

    monkeypatch.setattr("app.services.rag_service.semantic_search_news", fake_search)
    monkeypatch.setattr("app.services.rag_service.summarize_news_context", fake_summarize_news_context)

    result = await generate_news_rag_summary(
        session=cast("Any", None),
        query="请总结今日经济新闻",
        provider="openai",
    )

    assert result.summary == "OpenAI 摘要"
    assert result.results[0]["source"] == "xinhua"


async def test_generate_news_rag_summary_handles_empty_results(monkeypatch) -> None:
    async def fake_search(*_args, **_kwargs) -> list[dict]:
        return []

    monkeypatch.setattr("app.services.rag_service.semantic_search_news", fake_search)

    result = await generate_news_rag_summary(session=cast("Any", None), query="没有结果的查询")

    assert result.results == []
    assert "未检索到相关新闻" in result.summary
