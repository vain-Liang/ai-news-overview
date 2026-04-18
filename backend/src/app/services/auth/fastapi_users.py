from __future__ import annotations

from uuid import UUID

from fastapi_users import FastAPIUsers

from app.models.user import User
from app.services.auth.backend import bearer_backend, cookie_backend
from app.services.auth.dependencies import get_user_manager

fastapi_users = FastAPIUsers[User, UUID](
    get_user_manager,
    [cookie_backend, bearer_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
