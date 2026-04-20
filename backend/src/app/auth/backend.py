from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import Depends
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, CookieTransport
from fastapi_users.authentication.strategy.db import DatabaseStrategy

from app.auth.dependencies import get_access_token_db
from app.core.config import get_settings

if TYPE_CHECKING:
    from fastapi_users.authentication.strategy.db import AccessTokenDatabase

    from app.models.accesstoken import AccessToken

settings = get_settings()

cookie_transport = CookieTransport(
    cookie_name=settings.cookie_name,
    cookie_max_age=settings.cookie_max_age,
    cookie_path=settings.cookie_path,
    cookie_domain=settings.cookie_domain,
    cookie_secure=settings.cookie_secure,
    cookie_httponly=settings.cookie_httponly,
    cookie_samesite=settings.cookie_samesite,
)

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_database_strategy(
    access_token_db: AccessTokenDatabase[AccessToken] = Depends(get_access_token_db),
) -> DatabaseStrategy:
    return DatabaseStrategy(
        access_token_db,
        lifetime_seconds=settings.token_lifetime_seconds,
    )


cookie_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,
    get_strategy=get_database_strategy,
)

bearer_backend = AuthenticationBackend(
    name="bearer",
    transport=bearer_transport,
    get_strategy=get_database_strategy,
)
