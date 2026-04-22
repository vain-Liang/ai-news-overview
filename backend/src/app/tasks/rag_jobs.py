from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.core.database import async_session_maker
from app.services.rag_service import generate_news_rag_summary
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

_RETRY_COUNTDOWN = 3600
_MAX_RETRIES = 11


@celery_app.task(
    bind=True,
    name="app.tasks.rag_jobs.run_summarization_task",
    max_retries=_MAX_RETRIES,
    default_retry_delay=_RETRY_COUNTDOWN,
    acks_late=True,
)
def run_summarization_task(self, query: str) -> dict[str, Any]:
    """Generate a RAG news summary for the given query. Retries hourly on failure (up to 11 times per scheduled window)."""

    async def _run() -> dict[str, Any]:
        async with async_session_maker() as session:
            result = await generate_news_rag_summary(session, query=query)
        return result.to_dict()

    try:
        result = asyncio.run(_run())
        logger.info("Summarization pipeline completed for query=%r", query)
        return result
    except Exception as exc:
        logger.error("Summarization pipeline failed (attempt %d): %s", self.request.retries + 1, exc)
        raise self.retry(exc=exc, countdown=_RETRY_COUNTDOWN) from exc
