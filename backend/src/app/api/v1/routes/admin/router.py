from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.auth.fastapi_users import current_superuser
from app.core.database import get_async_session
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.user import User
from app.schemas.admin import (  # noqa: TC001
    AdminUserRead,
    AdminUsersPagination,
    AdminUsersResponse,
    AdminUsersSummary,
    AdminUserStatusUpdate,
)

admin_router = APIRouter(tags=["admin"])


def _parse_datetime(value: str | None, *, field_name: str) -> datetime | None:
    if value is None:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise BadRequestError(f"{field_name} must be a valid ISO datetime.") from exc


async def _load_admin_users_summary(session: AsyncSession) -> AdminUsersSummary:
    summary_statement = select(
        func.count(User.id),
        func.coalesce(func.sum(case((User.is_active.is_(True), 1), else_=0)), 0),
        func.coalesce(func.sum(case((User.is_superuser.is_(True), 1), else_=0)), 0),
    )
    total, active, superusers = (await session.execute(summary_statement)).one()
    total_users = int(total or 0)
    active_users = int(active or 0)
    superuser_count = int(superusers or 0)

    return AdminUsersSummary(
        total=total_users,
        active=active_users,
        inactive=total_users - active_users,
        superusers=superuser_count,
    )


@admin_router.get("/users", response_model=AdminUsersResponse)
async def list_admin_users(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _superuser: Annotated[User, Depends(current_superuser)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    search: Annotated[str | None, Query(max_length=100)] = None,
    created_from: str | None = None,
    created_to: str | None = None,
    updated_from: str | None = None,
    updated_to: str | None = None,
    is_active: bool | None = None,
) -> AdminUsersResponse:
    created_from_dt = _parse_datetime(created_from, field_name="created_from")
    created_to_dt = _parse_datetime(created_to, field_name="created_to")
    updated_from_dt = _parse_datetime(updated_from, field_name="updated_from")
    updated_to_dt = _parse_datetime(updated_to, field_name="updated_to")

    if created_from_dt and created_to_dt and created_from_dt > created_to_dt:
        raise BadRequestError("created_from cannot be later than created_to.")

    if updated_from_dt and updated_to_dt and updated_from_dt > updated_to_dt:
        raise BadRequestError("updated_from cannot be later than updated_to.")

    filters = []
    normalized_search = search.strip() if search else ""
    if normalized_search:
        search_value = f"%{normalized_search}%"
        filters.append(
            or_(
                User.username.ilike(search_value),
                User.nickname.ilike(search_value),
            )
        )

    if created_from_dt:
        filters.append(User.created_at >= created_from_dt)
    if created_to_dt:
        filters.append(User.created_at <= created_to_dt)
    if updated_from_dt:
        filters.append(User.updated_at >= updated_from_dt)
    if updated_to_dt:
        filters.append(User.updated_at <= updated_to_dt)
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))

    total_items_statement = select(func.count(User.id))
    if filters:
        total_items_statement = total_items_statement.where(*filters)

    total_items = int((await session.execute(total_items_statement)).scalar_one() or 0)
    pagination = AdminUsersPagination.create(page=page, page_size=page_size, total_items=total_items)

    statement = select(User)
    if filters:
        statement = statement.where(*filters)

    statement = statement.order_by(User.created_at.desc(), User.email.asc()).offset((page - 1) * page_size).limit(page_size)

    users = list((await session.execute(statement)).scalars().all())

    return AdminUsersResponse(
        summary=await _load_admin_users_summary(session),
        pagination=pagination,
        users=[AdminUserRead.model_validate(user) for user in users],
    )


@admin_router.patch("/users/{user_id}", response_model=AdminUserRead)
async def update_admin_user_status(
    user_id: str,
    payload: AdminUserStatusUpdate,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    superuser: Annotated[User, Depends(current_superuser)],
) -> AdminUserRead:
    target_user_id = uuid.UUID(user_id)

    if superuser.id == target_user_id and not payload.is_active:
        raise BadRequestError("Superusers cannot disable their own account.")

    user = await session.get(User, target_user_id)
    if user is None:
        raise NotFoundError("User not found.")

    user.is_active = payload.is_active
    await session.commit()
    await session.refresh(user)

    return AdminUserRead.model_validate(user)
