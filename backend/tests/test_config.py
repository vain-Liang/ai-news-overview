from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.core.config import Settings


def test_database_url_is_built_from_postgres_fields(settings: Settings) -> None:
    assert settings.get_database_url() == settings.build_postgres_dsn()
    assert settings.get_database_url().startswith("postgresql+asyncpg://")
    assert settings.postgres_db in settings.get_database_url()
