from __future__ import annotations

from app.crawlers.schemas import NewsArticle
from app.repositories.news import get_workflow_news_summary
from app.services.workflow_summary_service import generate_workflow_news_summary, register_workflow_news_snapshot


async def test_generate_workflow_news_summary_uses_stored_snapshot(monkeypatch) -> None:
    async def fake_summarize_news_context(*, query: str, context: str, provider: str | None = None) -> str:
        assert "工作流抓取到的新闻标题与原始摘要" in query
        assert "中国经济延续回升向好态势" in context
        assert "多个指标显示工业与消费同步改善" in context
        assert "多地推出举措提振消费" in context
        assert provider == "openai"
        return "工作流摘要\n- 要点1\n- 要点2"

    monkeypatch.setattr("app.services.workflow_summary_service.summarize_news_context", fake_summarize_news_context)

    articles = [
        NewsArticle(
            id="news-1",
            url="https://www.news.cn/sample-1",
            source="xinhua",
            title="中国经济延续回升向好态势",
            summary="多个指标显示工业与消费同步改善。",
            author="新华社",
            published_at="2026-04-19 08:00",
            crawled_at="2026-04-19T08:30:00+00:00",
        ),
        NewsArticle(
            id="news-2",
            url="https://www.ifeng.com/sample-2",
            source="ifeng",
            title="多地推出举措提振消费",
            summary="地方政策与节庆活动共同拉动消费回暖。",
            author="凤凰网",
            published_at="2026-04-19 09:00",
            crawled_at="2026-04-19T09:10:00+00:00",
        ),
    ]

    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        snapshot = await register_workflow_news_snapshot(session, workflow_task_id="wf-1", articles=articles)

    assert snapshot.workflow_task_id == "wf-1"
    assert snapshot.article_count == 2
    assert snapshot.summary == ""

    async with async_session_maker() as session:
        result = await generate_workflow_news_summary(
            session,
            workflow_task_id="wf-1",
            provider="openai",
            summary_task_id="summary-1",
        )

    assert result.workflow_task_id == "wf-1"
    assert result.summary_task_id == "summary-1"
    assert result.summary == "工作流摘要\n- 要点1\n- 要点2"
    assert result.sources == ["ifeng", "xinhua"]

    async with async_session_maker() as session:
        record = await get_workflow_news_summary(session, "wf-1")

    assert record is not None
    assert record.summary == "工作流摘要\n- 要点1\n- 要点2"
    assert record.provider == "openai"
    assert record.summary_task_id == "summary-1"
    assert record.article_count == 2
    assert record.articles[0]["title"] == "中国经济延续回升向好态势"


async def test_generate_workflow_news_summary_handles_empty_snapshot() -> None:
    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        await register_workflow_news_snapshot(session, workflow_task_id="wf-empty", articles=[])

    async with async_session_maker() as session:
        result = await generate_workflow_news_summary(session, workflow_task_id="wf-empty", summary_task_id="summary-empty")

    assert result.summary == "本次工作流没有抓取到可用于摘要的新闻。"
    assert result.article_count == 0
    assert result.summary_task_id == "summary-empty"
