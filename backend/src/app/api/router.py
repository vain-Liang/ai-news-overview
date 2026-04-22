from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes.auth import auth_router
from app.api.v1.routes.news import news_router
from app.api.v1.routes.pipeline import pipeline_router
from app.api.v1.routes.system import system_router
from app.api.v1.routes.users import users_router

api_router = APIRouter()
api_router.include_router(system_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(news_router)
api_router.include_router(pipeline_router)
