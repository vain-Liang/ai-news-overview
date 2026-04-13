from __future__ import annotations

from uuid import UUID

from fastapi_users import schemas


class UserRead(schemas.BaseUser[UUID]):
    username: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None


class UserCreate(schemas.BaseUserCreate):
    username: str | None = None
    nickname: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    username: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
