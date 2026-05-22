from __future__ import annotations

from typing import Annotated

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.auth.fastapi_users import current_superuser
from app.core.database import get_async_session
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.news import (
    get_workflow_news_summary,
    get_workflow_summary_counts,
    list_workflow_summaries,
    set_workflow_summary_task,
)
from app.schemas.admin_workflow import (  # noqa: TC001
    AdminWorkflowActionResponse,
    AdminWorkflowCancelResponse,
    AdminWorkflowDetail,
    AdminWorkflowListResponse,
    AdminWorkflowPagination,
    AdminWorkflowRead,
    AdminWorkflowResummarizeRequest,
    AdminWorkflowRetriggerRequest,
    AdminWorkflowSummary,
)
from app.tasks.celery_app import celery_app
from app.tasks.crawl_jobs import run_retrieval_task
from app.tasks.rag_jobs import run_summarization_task

admin_workflow_router = APIRouter(prefix="/workflows", tags=["admin", "workflows"])


def _get_task_status(task_id: str) -> str:
    """Map Celery task state to workflow status."""
    result = AsyncResult(task_id)
    state = result.state
    if state == "PENDING":
        return "queued"
    elif state in ("STARTED", "RETRY"):
        return "running"
    elif state == "SUCCESS":
        return "success"
    elif state == "FAILURE":
        return "failure"
    else:
        return "unknown"


@admin_workflow_router.get("", response_model=AdminWorkflowListResponse)
async def list_admin_workflows(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _superuser: Annotated[User, Depends(current_superuser)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    has_summary: bool | None = None,
    source: Annotated[str | None, Query(max_length=100)] = None,
) -> AdminWorkflowListResponse:
    total, with_summary, latest_run = await get_workflow_summary_counts(session)
    summary = AdminWorkflowSummary(
        total=total,
        with_summary=with_summary,
        pending_summary=total - with_summary,
        latest_run=latest_run,
    )

    pagination = AdminWorkflowPagination.create(page=page, page_size=page_size, total_items=total)

    rows, total_from_filter = await list_workflow_summaries(
        session, page=page, page_size=page_size, has_summary=has_summary, source=source
    )

    if has_summary is not None or source:
        pagination = AdminWorkflowPagination.create(
            page=page, page_size=page_size, total_items=total_from_filter
        )

    workflows: list[AdminWorkflowRead] = []
    for row in rows:
        workflow_status = _get_task_status(row.workflow_task_id)
        if row.summary_task_id is None:
            summary_status = "skipped" if row.article_count == 0 else "pending"
        else:
            summary_status = _get_task_status(row.summary_task_id)

        summary_text = row.summary[:280] + "…" if len(row.summary) > 280 else row.summary

        workflow_read = AdminWorkflowRead(
            workflow_task_id=row.workflow_task_id,
            summary_task_id=row.summary_task_id,
            provider=row.provider,
            sources=row.sources,
            article_count=row.article_count,
            summary=summary_text,
            summary_generated_at=row.summary_generated_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
            workflow_status=workflow_status,
            summary_status=summary_status,
        )
        workflows.append(workflow_read)

    return AdminWorkflowListResponse(
        summary=summary,
        pagination=pagination,
        workflows=workflows,
    )


@admin_workflow_router.get("/{workflow_task_id}", response_model=AdminWorkflowDetail)
async def get_admin_workflow_detail(
    workflow_task_id: str,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _superuser: Annotated[User, Depends(current_superuser)],
) -> AdminWorkflowDetail:
    record = await get_workflow_news_summary(session, workflow_task_id)
    if record is None:
        raise NotFoundError("Workflow not found.")

    workflow_status = _get_task_status(record.workflow_task_id)
    if record.summary_task_id is None:
        summary_status = "skipped" if record.article_count == 0 else "pending"
    else:
        summary_status = _get_task_status(record.summary_task_id)

    return AdminWorkflowDetail(
        workflow_task_id=record.workflow_task_id,
        summary_task_id=record.summary_task_id,
        provider=record.provider,
        sources=record.sources,
        article_count=record.article_count,
        summary=record.summary,
        summary_generated_at=record.summary_generated_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
        workflow_status=workflow_status,
        summary_status=summary_status,
        articles=record.articles,
    )


@admin_workflow_router.post("/retrigger", response_model=AdminWorkflowActionResponse)
async def retrigger_workflow(
    payload: AdminWorkflowRetriggerRequest,
    _superuser: Annotated[User, Depends(current_superuser)],
) -> AdminWorkflowActionResponse:
    task = run_retrieval_task.delay(sources=payload.sources)
    return AdminWorkflowActionResponse(task_id=task.id, status="queued")


@admin_workflow_router.post("/{workflow_task_id}/resummarize", response_model=AdminWorkflowActionResponse)
async def resummarize_workflow(
    workflow_task_id: str,
    payload: AdminWorkflowResummarizeRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _superuser: Annotated[User, Depends(current_superuser)],
) -> AdminWorkflowActionResponse:
    record = await get_workflow_news_summary(session, workflow_task_id)
    if record is None:
        raise NotFoundError("Workflow not found.")

    task = run_summarization_task.delay(workflow_task_id=workflow_task_id, provider=payload.provider)
    await set_workflow_summary_task(
        session,
        workflow_task_id=workflow_task_id,
        summary_task_id=task.id,
    )

    return AdminWorkflowActionResponse(task_id=task.id, status="queued")


@admin_workflow_router.post("/{task_id}/cancel", response_model=AdminWorkflowCancelResponse)
async def cancel_workflow_task(
    task_id: str,
    _superuser: Annotated[User, Depends(current_superuser)],
) -> AdminWorkflowCancelResponse:
    if not celery_app.conf.worker_enable_remote_control:
        return AdminWorkflowCancelResponse(task_id=task_id, revoked=False)

    try:
        celery_app.control.revoke(task_id, terminate=True, signal="SIGTERM")
        return AdminWorkflowCancelResponse(task_id=task_id, revoked=True)
    except RuntimeError:
        return AdminWorkflowCancelResponse(task_id=task_id, revoked=False)
