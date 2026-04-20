from __future__ import annotations

from typing import Any, cast

import pytest

from app.core.config import Settings


def test_database_url_is_built_from_postgres_fields(settings: Settings) -> None:
    assert settings.get_database_url() == settings.build_postgres_dsn()
    assert settings.get_database_url().startswith("postgresql+asyncpg://")
    assert settings.postgres_db in settings.get_database_url()


def test_valid_settings() -> None:
    settings = Settings(
        auth_secret="test-secret",
        postgres_host="localhost",
        postgres_user="user",
        postgres_password="pass",
        postgres_db="db",
    )
    assert settings.cookie_samesite == "lax"
    assert settings.frontend_base_url == "http://127.0.0.1:5173"
    assert settings.email_rate_limit_times == 5
    assert settings.llm_provider == "deepseek"


def test_openai_provider_can_be_selected() -> None:
    settings = Settings(
        auth_secret="test-secret",
        postgres_host="localhost",
        postgres_user="user",
        postgres_password="pass",
        postgres_db="db",
        llm_provider="openai",
    )
    assert settings.llm_provider == "openai"


def test_invalid_samesite() -> None:
    with pytest.raises(ValueError, match="Input should be 'lax', 'strict' or 'none'"):
        Settings(
            auth_secret="test",
            postgres_host="localhost",
            postgres_user="user",
            postgres_password="pass",
            postgres_db="db",
            cookie_samesite=cast("Any", "invalid"),
        )


def test_samesite_none_requires_secure() -> None:
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


def test_mail_enabled_requires_host_and_sender() -> None:
    with pytest.raises(ValueError, match="Missing required mail settings"):
        Settings(
            auth_secret="test-secret",
            postgres_host="localhost",
            postgres_user="user",
            postgres_password="pass",
            postgres_db="db",
            mail_enabled=True,
            smtp_host="",
            mail_sender_email="",
        )


def test_mail_tls_and_ssl_cannot_both_be_enabled() -> None:
    with pytest.raises(ValueError, match="cannot both be True"):
        Settings(
            auth_secret="test-secret",
            postgres_host="localhost",
            postgres_user="user",
            postgres_password="pass",
            postgres_db="db",
            mail_enabled=True,
            smtp_host="smtp.example.com",
            mail_sender_email="noreply@example.com",
            smtp_use_tls=True,
            smtp_use_ssl=True,
        )
