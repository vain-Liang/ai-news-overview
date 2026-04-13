from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any
from uuid import UUID

from fastapi import Depends
from fastapi_users import BaseUserManager, InvalidPasswordException, UUIDIDMixin

from app.auth.dependencies import get_user_db
from app.core.config import get_settings
from app.models.user import User

if TYPE_CHECKING:
    from fastapi import Request, Response
    from fastapi_users.db import SQLAlchemyUserDatabase

settings = get_settings()
logger = logging.getLogger(__name__)
user_db_dependency = Depends(get_user_db)


class UserManager(UUIDIDMixin, BaseUserManager[User, UUID]):
    reset_password_token_secret = settings.auth_secret
    verification_token_secret = settings.auth_secret

    async def validate_password(self, password: str, user: User | Any) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(
                reason="Password should be at least 8 characters",
            )
        if user.email and user.email.lower() in password.lower():
            raise InvalidPasswordException(
                reason="Password should not contain e-mail",
            )

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        logger.info("User %s has registered.", user.id)

    async def on_after_login(
        self,
        user: User,
        request: Request | None = None,
        response: Response | None = None,
    ) -> None:
        logger.info("User %s logged in.", user.id)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase[User, UUID] = user_db_dependency,
):
    yield UserManager(user_db)
