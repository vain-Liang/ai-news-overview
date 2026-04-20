from __future__ import annotations

from fastapi import APIRouter

from app.auth.fastapi_users import fastapi_users
from app.schemas.user import UserRead, UserUpdate

users_router = APIRouter(tags=["users"])

users_router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
)
