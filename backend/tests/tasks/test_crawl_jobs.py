from __future__ import annotations

from app.crawlers.schemas import NewsArticle
from app.services.news_service import NewsIngestionResult


def test_run_retrieval_task_queues_workflow_summary(monkeypatch) -> None:
    from app.tasks.crawl_jobs import run_retrieval_task

    async def fake_ingest(*_args, **_kwargs):
        return (
            NewsIngestionResult(
                crawled_count=1,
                metadata_stored_count=1,
                vector_stored_count=1,
                by_source={"xinhua": 1},
            ),
            [
                NewsArticle(
                    id="news-1",
                    url="https://www.news.cn/sample-1",
                    source="xinhua",
                    title="测试新闻",
                    summary="测试摘要",
                    author="新华社",
                    published_at="2026-04-19 08:00",
                    crawled_at="2026-04-19T08:30:00+00:00",
                )
            ],
        )

    captured: dict[str, object] = {}

    async def fake_register_snapshot(*_args, workflow_task_id: str, articles, **_kwargs):
        captured["workflow_task_id"] = workflow_task_id
        captured["article_count"] = len(list(articles))
        return None

    async def fake_set_summary_task(*_args, workflow_task_id: str, summary_task_id: str, **_kwargs):
        captured["stored_summary_task_id"] = summary_task_id
        captured["stored_summary_workflow_task_id"] = workflow_task_id
        return None

    class DummyAsyncResult:
        id = "summary-task-1"

    class DummySummarizationTask:
        @staticmethod
        def delay(*, workflow_task_id: str):
            captured["summary_delay_workflow_task_id"] = workflow_task_id
            return DummyAsyncResult()

    monkeypatch.setattr("app.tasks.crawl_jobs.ingest_homepage_news_with_articles", fake_ingest)
    monkeypatch.setattr("app.tasks.crawl_jobs.register_workflow_news_snapshot", fake_register_snapshot)
    monkeypatch.setattr("app.tasks.crawl_jobs.set_workflow_summary_task", fake_set_summary_task)
    monkeypatch.setattr("app.tasks.crawl_jobs.run_summarization_task", DummySummarizationTask)

    run_retrieval_task.push_request(id="workflow-task-1", retries=0)
    try:
        result = run_retrieval_task.run(sources=["xinhua"])
    finally:
        run_retrieval_task.pop_request()

    assert result["workflow_task_id"] == "workflow-task-1"
    assert result["workflow_summary_status"] == "queued"
    assert result["summary_task_id"] == "summary-task-1"
    assert captured["workflow_task_id"] == "workflow-task-1"
    assert captured["summary_delay_workflow_task_id"] == "workflow-task-1"
    assert captured["stored_summary_task_id"] == "summary-task-1"
    assert captured["stored_summary_workflow_task_id"] == "workflow-task-1"


def test_run_retrieval_task_skips_summary_when_no_articles(monkeypatch) -> None:
    from app.tasks.crawl_jobs import run_retrieval_task

    async def fake_ingest(*_args, **_kwargs):
        return (
            NewsIngestionResult(
                crawled_count=0,
                metadata_stored_count=0,
                vector_stored_count=0,
                by_source={},
            ),
            [],
        )

    async def fake_register_snapshot(*_args, **_kwargs):
        return None

    async def fake_set_summary_task(*_args, **_kwargs):
        raise AssertionError("summary task metadata should not be stored when no articles were fetched")

    class DummySummarizationTask:
        @staticmethod
        def delay(**_kwargs):
            raise AssertionError("summary should not be queued when no articles were fetched")

    monkeypatch.setattr("app.tasks.crawl_jobs.ingest_homepage_news_with_articles", fake_ingest)
    monkeypatch.setattr("app.tasks.crawl_jobs.register_workflow_news_snapshot", fake_register_snapshot)
    monkeypatch.setattr("app.tasks.crawl_jobs.set_workflow_summary_task", fake_set_summary_task)
    monkeypatch.setattr("app.tasks.crawl_jobs.run_summarization_task", DummySummarizationTask)

    run_retrieval_task.push_request(id="workflow-task-empty", retries=0)
    try:
        result = run_retrieval_task.run(sources=["xinhua"])
    finally:
        run_retrieval_task.pop_request()

    assert result["workflow_task_id"] == "workflow-task-empty"
    assert result["workflow_summary_status"] == "skipped"
    assert result["summary_task_id"] is None
