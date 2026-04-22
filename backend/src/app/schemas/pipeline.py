from __future__ import annotations

from pydantic import BaseModel, Field


class PipelineTriggerRequest(BaseModel):
    sources: list[str] | None = None


class SummarizationTriggerRequest(BaseModel):
    query: str = Field(min_length=1, description="Query for the RAG news summary")


class TaskEnqueuedResponse(BaseModel):
    task_id: str
    status: str = "queued"


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: object | None = None
    error: str | None = None
