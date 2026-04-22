from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request, status  # noqa: TC002
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import api_router
from app.api.v1.routes.admin import admin_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import request_id_ctx, setup_logging

logger = logging.getLogger(__name__)


def _error_body(code: str, message: str, request_id: str, details: object = None) -> dict:
    payload: dict = {"code": code, "message": message, "request_id": request_id}
    if details is not None:
        payload["details"] = details
    return {"error": payload}


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        rid = request.state.request_id
        logger.warning("AppError [%s] %s rid=%s path=%s", exc.error_code, exc.message, rid, request.url.path)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.error_code, exc.message, rid),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        rid = request.state.request_id
        details = [
            {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]}
            for err in exc.errors()
        ]
        logger.info("Validation error rid=%s path=%s errors=%s", rid, request.url.path, details)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_body("VALIDATION_ERROR", "Request validation failed", rid, details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        rid = request.state.request_id
        if exc.status_code >= 500:
            logger.error("HTTP %d rid=%s path=%s detail=%s", exc.status_code, rid, request.url.path, exc.detail)
        else:
            logger.info("HTTP %d rid=%s path=%s detail=%s", exc.status_code, rid, request.url.path, exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body("HTTP_ERROR", str(exc.detail), rid),
            headers=getattr(exc, "headers", None) or {},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, _exc: Exception) -> JSONResponse:
        rid = request.state.request_id
        logger.exception("Unhandled exception rid=%s path=%s", rid, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body("INTERNAL_ERROR", "An unexpected error occurred", rid),
        )


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(level=settings.log_level, fmt=settings.log_format)

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = rid
        token = request_id_ctx.set(rid)
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        response.headers["X-Request-ID"] = rid
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _register_exception_handlers(app)
    app.include_router(api_router)
    app.include_router(admin_router, prefix=settings.admin_api_prefix_path)

    logger.info(
        "Application '%s' started (debug=%s, log_level=%s)",
        settings.app_name,
        settings.debug,
        settings.log_level,
    )
    return app


app = create_app()
