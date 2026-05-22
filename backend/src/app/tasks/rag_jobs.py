from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from app.core.database import async_session_maker
from app.services.workflow_summary_service import generate_workflow_news_summary
from app.tasks.celery_app import celery_app

if TYPE_CHECKING:
    from app.core.config import LlmProvider

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
def run_summarization_task(self, workflow_task_id: str, provider: LlmProvider | None = None) -> dict[str, Any]:
    """Generate a workflow news summary from the stored retrieval snapshot."""

    async def _run() -> dict[str, Any]:
        async with async_session_maker() as session:
            result = await generate_workflow_news_summary(
                session,
                workflow_task_id=workflow_task_id,
                provider=provider,
                summary_task_id=self.request.id,
            )
        return result.to_dict()

    try:
        result = asyncio.run(_run())
        logger.info("Workflow summarization completed for workflow_task_id=%r", workflow_task_id)
        return result
    except ValueError:
        logger.exception("Workflow summarization failed permanently for workflow_task_id=%r", workflow_task_id)
        raise
    except Exception as exc:
        logger.error("Summarization pipeline failed (attempt %d): %s", self.request.retries + 1, exc)
        raise self.retry(exc=exc, countdown=_RETRY_COUNTDOWN) from exc
