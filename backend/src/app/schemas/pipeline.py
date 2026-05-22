from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.config import LlmProvider


class PipelineTriggerRequest(BaseModel):
    sources: list[str] | None = None


class SummarizationTriggerRequest(BaseModel):
    workflow_task_id: str = Field(min_length=1, description="Workflow retrieval task id to summarize")
    provider: LlmProvider | None = None


class TaskEnqueuedResponse(BaseModel):
    task_id: str
    status: str = "queued"


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: object | None = None
    error: str | None = None
