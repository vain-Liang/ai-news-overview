from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING

import asyncpg
import httpx
import pytest
from alembic import command
from alembic.config import Config

BACKEND_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = BACKEND_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Iterator

    from fastapi import FastAPI

    from app.core.config import Settings


def _get_settings_model() -> type[Settings]:
    from app.core.config import Settings

    return Settings


def _get_cached_settings() -> Settings:
    from app.core.config import get_settings

    return get_settings()


def _clear_settings_cache() -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()


def _run(coro):
    return asyncio.run(coro)


def _quote_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


async def _ensure_database_exists(admin_dsn: str, database_name: str) -> None:
    connection = await asyncpg.connect(admin_dsn)
    try:
        exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            database_name,
        )
        if not exists:
            await connection.execute(f"CREATE DATABASE {_quote_identifier(database_name)}")
    finally:
        await connection.close()


async def _reset_public_schema(database_dsn: str) -> None:
    connection = await asyncpg.connect(database_dsn)
    try:
        await connection.execute("DROP SCHEMA IF EXISTS public CASCADE")
        await connection.execute("CREATE SCHEMA public")
    finally:
        await connection.close()


async def _truncate_users_table(database_dsn: str) -> None:
    connection = await asyncpg.connect(database_dsn)
    try:
        await connection.execute("TRUNCATE TABLE users RESTART IDENTITY CASCADE")
    finally:
        await connection.close()


@pytest.fixture(scope="session", autouse=True)
def configured_test_database() -> Iterator[None]:
    settings_model = _get_settings_model()
    base_settings = settings_model()
    test_database_name = f"{base_settings.postgres_db}_test"
    admin_dsn = base_settings.build_postgres_dsn(driver="postgresql", database="postgres")
    test_dsn = base_settings.build_postgres_dsn(driver="postgresql", database=test_database_name)

    _run(_ensure_database_exists(admin_dsn, test_database_name))

    os.environ["POSTGRES_HOST"] = base_settings.postgres_host
    os.environ["POSTGRES_PORT"] = str(base_settings.postgres_port)
    os.environ["POSTGRES_USER"] = base_settings.postgres_user
    os.environ["POSTGRES_PASSWORD"] = base_settings.postgres_password
    os.environ["POSTGRES_DB"] = test_database_name
    os.environ["DEBUG"] = "false"
    os.environ.pop("DATABASE_URL", None)
    _clear_settings_cache()

    _run(_reset_public_schema(test_dsn))
    command.upgrade(Config(str(BACKEND_DIR / "alembic.ini")), "head")

    yield

    _clear_settings_cache()


@pytest.fixture(autouse=True)
def clean_users_table() -> Iterator[None]:
    settings = _get_cached_settings()
    _run(_truncate_users_table(settings.build_postgres_dsn(driver="postgresql")))
    yield


@pytest.fixture(scope="session")
def app() -> FastAPI:
    from app.main import app as fastapi_app

    return fastapi_app


@pytest.fixture
def settings() -> Settings:
    _clear_settings_cache()
    return _get_cached_settings()


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
