from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter

from app.core.config import get_settings

system_router = APIRouter(tags=["system"])


@system_router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@system_router.get("/system/runtime")
async def system_runtime() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "debug": settings.debug,
        "server_time": datetime.now(UTC).isoformat(),
        "auth": {
            "register_path": "/auth/register",
            "login_path": "/auth/jwt/login and /auth/cookie/login",
            "api_auth_path": "/auth/jwt/login and /auth/jwt/logout",
            "forgot_password_path": "/auth/forgot-password",
            "reset_password_path": "/auth/reset-password",
            "request_verify_path": "/auth/request-verify-token",
            "verify_path": "/auth/verify",
            "me_path": "/users/me",
        },
    }
