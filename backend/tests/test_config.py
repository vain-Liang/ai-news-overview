from __future__ import annotations

import pytest

from app.core.config import Settings


def test_database_url_is_built_from_postgres_fields(settings: Settings) -> None:
    assert settings.get_database_url() == settings.build_postgres_dsn()
    assert settings.get_database_url().startswith("postgresql+asyncpg://")
    assert settings.postgres_db in settings.get_database_url()


def test_valid_settings():
    """Test that valid settings load correctly."""
    settings = Settings(
        auth_secret="test-secret",
        postgres_host="localhost",
        postgres_user="user",
        postgres_password="pass",
        postgres_db="db",
    )
    assert settings.cookie_samesite == "lax"


def test_invalid_samesite():
    """Test that invalid samesite raises error."""
    with pytest.raises(ValueError, match="Input should be 'lax', 'strict' or 'none'"):
        Settings(
            auth_secret="test",
            postgres_host="localhost",
            postgres_user="user",
            postgres_password="pass",
            postgres_db="db",
            cookie_samesite="invalid",
        )


def test_samesite_none_requires_secure():
    """Test that samesite='none' requires secure=True."""
    with pytest.raises(ValueError, match="secure must be True"):
        Settings(
            auth_secret="test",
            postgres_host="localhost",
            postgres_user="user",
            postgres_password="pass",
            postgres_db="db",
            cookie_samesite="none",
            cookie_secure=False,
        )
