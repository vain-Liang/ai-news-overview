from __future__ import annotations

from fastapi import APIRouter

from app.schemas.user import UserCreate, UserRead
from app.services.auth.backend import bearer_backend, cookie_backend
from app.services.auth.fastapi_users import fastapi_users

auth_router = APIRouter(tags=["auth"])

auth_router.include_router(
    fastapi_users.get_auth_router(cookie_backend),
    prefix="/auth/cookie",
)

auth_router.include_router(
    fastapi_users.get_auth_router(bearer_backend),
    prefix="/auth/jwt",
)

auth_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
)

auth_router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
)
