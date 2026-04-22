from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.core.database import async_session_maker
from app.services.news_service import ingest_homepage_news
from app.tasks.celery_app import celery_app

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
    """Run the full news retrieval pipeline (crawl + ingest).

    Scheduled twice daily at 00:00 and 12:00 UTC. Retries hourly on failure
    (up to 11 times per scheduled window). Chains to summarization on success.
    """

    async def _run() -> dict[str, Any]:
        async with async_session_maker() as session:
            result = await ingest_homepage_news(session, sources=sources)
        return result.to_dict()

    try:
        result = asyncio.run(_run())
        logger.info("Retrieval pipeline completed: %s", result)
        return result
    except Exception as exc:
        logger.error("Retrieval pipeline failed (attempt %d): %s", self.request.retries + 1, exc)
        raise self.retry(exc=exc, countdown=_RETRY_COUNTDOWN) from exc
