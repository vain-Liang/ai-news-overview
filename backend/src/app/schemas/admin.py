from __future__ import annotations

from math import ceil

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field  # noqa: TC002

from app.schemas.user import UserRead


class AdminUserRead(UserRead):
    created_at: AwareDatetime
    updated_at: AwareDatetime


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminUsersSummary(BaseModel):
    total: int
    active: int
    inactive: int
    superusers: int


class AdminUsersPagination(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1)
    total_items: int = Field(default=0, ge=0)
    total_pages: int = Field(default=0, ge=0)

    model_config = ConfigDict(validate_assignment=True)

    @classmethod
    def create(cls, *, page: int, page_size: int, total_items: int) -> AdminUsersPagination:
        total_pages = ceil(total_items / page_size) if total_items > 0 else 0
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        )


class AdminUsersResponse(BaseModel):
    summary: AdminUsersSummary
    pagination: AdminUsersPagination
    users: list[AdminUserRead]
