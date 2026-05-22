from __future__ import annotations

from math import ceil

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field  # noqa: TC002


class AdminWorkflowSummary(BaseModel):
    total: int
    with_summary: int
    pending_summary: int
    latest_run: AwareDatetime | None


class AdminWorkflowPagination(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1)
    total_items: int = Field(default=0, ge=0)
    total_pages: int = Field(default=0, ge=0)

    model_config = ConfigDict(validate_assignment=True)

    @classmethod
    def create(cls, *, page: int, page_size: int, total_items: int) -> AdminWorkflowPagination:
        total_pages = ceil(total_items / page_size) if total_items > 0 else 0
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        )


class AdminWorkflowRead(BaseModel):
    workflow_task_id: str
    summary_task_id: str | None
    provider: str
    sources: list[str]
    article_count: int
    summary: str
    summary_generated_at: AwareDatetime | None
    created_at: AwareDatetime
    updated_at: AwareDatetime
    workflow_status: str
    summary_status: str

    model_config = ConfigDict(from_attributes=True)


class AdminWorkflowDetail(AdminWorkflowRead):
    articles: list[dict]  # type: ignore[assignment]


class AdminWorkflowListResponse(BaseModel):
    summary: AdminWorkflowSummary
    pagination: AdminWorkflowPagination
    workflows: list[AdminWorkflowRead]


class AdminWorkflowRetriggerRequest(BaseModel):
    sources: list[str] | None = None


class AdminWorkflowResummarizeRequest(BaseModel):
    provider: str | None = None


class AdminWorkflowActionResponse(BaseModel):
    task_id: str
    status: str = "queued"


class AdminWorkflowCancelResponse(BaseModel):
    task_id: str
    revoked: bool
