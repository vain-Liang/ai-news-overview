from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.core.database import async_session_maker
from app.repositories.news import set_workflow_summary_task
from app.services.news_service import ingest_homepage_news_with_articles
from app.services.workflow_summary_service import register_workflow_news_snapshot
from app.tasks.celery_app import celery_app
from app.tasks.rag_jobs import run_summarization_task

logger = logging.getLogger(__name__)

_RETRY_COUNTDOWN = 3600
_MAX_RETRIES = 11


@celery_app.task(
    bind=True,
    name="app.tasks.crawl_jobs.run_retrieval_task",
    max_retries=_MAX_RETRIES,
    default_retry_delay=_RETRY_COUNTDOWN,
    acks_late=True,
)
def run_retrieval_task(self, sources: list[str] | None = None) -> dict[str, Any]:
    """Run the full news retrieval pipeline (crawl + ingest), then queue workflow summarization from the fetched snapshot."""

    async def _run() -> dict[str, Any]:
        workflow_task_id = self.request.id
        async with async_session_maker() as session:
            result, articles = await ingest_homepage_news_with_articles(session, sources=sources)
            await register_workflow_news_snapshot(session, workflow_task_id=workflow_task_id, articles=articles)

            payload: dict[str, Any] = {
                **result.to_dict(),
                "workflow_task_id": workflow_task_id,
                "workflow_summary_status": "skipped",
                "summary_task_id": None,
            }
            if not articles:
                return payload

            summary_task = run_summarization_task.delay(workflow_task_id=workflow_task_id)
            await set_workflow_summary_task(
                session,
                workflow_task_id=workflow_task_id,
                summary_task_id=summary_task.id,
            )
            payload["workflow_summary_status"] = "queued"
            payload["summary_task_id"] = summary_task.id
            return payload

    try:
        result = asyncio.run(_run())
        logger.info("Retrieval pipeline completed: %s", result)
        return result
    except Exception as exc:
        logger.error("Retrieval pipeline failed (attempt %d): %s", self.request.retries + 1, exc)
        raise self.retry(exc=exc, countdown=_RETRY_COUNTDOWN) from exc
