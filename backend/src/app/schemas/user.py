from __future__ import annotations

from uuid import UUID

from fastapi_users import schemas
from pydantic import field_validator


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


class UserRead(schemas.BaseUser[UUID]):
    username: str | None = None
    nickname: str | None = None


class UserCreate(schemas.BaseUserCreate):
    username: str | None = None
    nickname: str | None = None

    @field_validator("username", "nickname", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("username")
    @classmethod
    def validate_username_length(cls, value: str | None) -> str | None:
        if value and len(value) > 50:
            raise ValueError("Username must be 50 characters or fewer.")
        return value

    @field_validator("nickname")
    @classmethod
    def validate_nickname_length(cls, value: str | None) -> str | None:
        if value and len(value) > 100:
            raise ValueError("Nickname must be 100 characters or fewer.")
        return value


class UserUpdate(schemas.BaseUserUpdate):
    username: str | None = None
    nickname: str | None = None

    @field_validator("username", "nickname", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("username")
    @classmethod
    def validate_username_length(cls, value: str | None) -> str | None:
        if value and len(value) > 50:
            raise ValueError("Username must be 50 characters or fewer.")
        return value

    @field_validator("nickname")
    @classmethod
    def validate_nickname_length(cls, value: str | None) -> str | None:
        if value and len(value) > 100:
            raise ValueError("Nickname must be 100 characters or fewer.")
        return value
