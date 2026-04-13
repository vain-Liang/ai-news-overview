from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase

from app.core.db import get_async_session
from app.models.user import User

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

async_session_dependency = Depends(get_async_session)


async def get_user_db(
    session: AsyncSession = async_session_dependency,
) -> AsyncGenerator[SQLAlchemyUserDatabase[User, UUID], None]:
    yield SQLAlchemyUserDatabase(session, User)
