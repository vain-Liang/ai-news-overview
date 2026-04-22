from __future__ import annotations

from typing import Annotated

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, status

from app.auth.fastapi_users import current_active_user
from app.models.user import User  # noqa: TC001
from app.schemas.pipeline import (  # noqa: TC001
    PipelineTriggerRequest,
    SummarizationTriggerRequest,
    TaskEnqueuedResponse,
    TaskStatusResponse,
)
from app.services.pipeline_rate_limit import pipeline_rate_limit
from app.tasks.crawl_jobs import run_retrieval_task
from app.tasks.rag_jobs import run_summarization_task

pipeline_router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@pipeline_router.post(
    "/retrieve",
    response_model=TaskEnqueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_retrieval(
    payload: PipelineTriggerRequest,
    _user: Annotated[User, Depends(pipeline_rate_limit("retrieve"))],
) -> TaskEnqueuedResponse:
    """Manually trigger news retrieval. Chains to summarization on completion."""
    task = run_retrieval_task.delay(sources=payload.sources)
    return TaskEnqueuedResponse(task_id=task.id)


@pipeline_router.post(
    "/summarize",
    response_model=TaskEnqueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_summarization(
    payload: SummarizationTriggerRequest,
    _user: Annotated[User, Depends(pipeline_rate_limit("summarize"))],
) -> TaskEnqueuedResponse:
    """Manually trigger news summarization."""
    task = run_summarization_task.delay(query=payload.query)
    return TaskEnqueuedResponse(task_id=task.id)


@pipeline_router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    _user: Annotated[User, Depends(current_active_user)],
) -> TaskStatusResponse:
    """Poll the status of a previously enqueued pipeline task."""
    result = AsyncResult(task_id)
    state = result.state

    if state == "FAILURE":
        exc = result.result
        return TaskStatusResponse(
            task_id=task_id,
            status=state,
            error=str(exc) if exc else "Unknown error",
        )

    return TaskStatusResponse(
        task_id=task_id,
        status=state,
        result=result.result if state == "SUCCESS" else None,
    )
