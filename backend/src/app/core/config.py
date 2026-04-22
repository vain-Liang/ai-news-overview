from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[3]
LlmProvider = Literal["deepseek", "openai"]
LogFormat = Literal["text", "json"]


class Settings(BaseSettings):
    app_name: str = "AI News Overview"
    debug: bool = True
    log_level: str = "INFO"
    log_format: LogFormat = "text"

    postgres_host: str = ""
    postgres_port: int = 5432
    postgres_user: str = ""
    postgres_password: str = ""
    postgres_db: str = ""

    chroma_persist_dir: str = "./data/chroma"
    chroma_collection_name: str = "news_articles"

    llm_provider: LlmProvider = "deepseek"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"
    deepseek_temperature: float = Field(0.2, ge=0, le=2)
    deepseek_max_completion_tokens: int = Field(1200, gt=0)

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = Field(0.2, ge=0, le=2)
    openai_max_completion_tokens: int = Field(1200, gt=0)

    auth_secret: str = ""
    frontend_base_url: str = "http://127.0.0.1:5173"
    admin_api_prefix: str = "/admin/"

    mail_enabled: bool = False
    mail_sender_email: str = "noreply@example.com"
    mail_sender_name: str = "AI News Overview"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_validate_certs: bool = True
    smtp_timeout_seconds: float = Field(10.0, gt=0)
    email_rate_limit_times: int = Field(5, gt=0)
    email_rate_limit_seconds: int = Field(60, gt=0)

    cookie_name: str = "fastapiusersauth"
    cookie_max_age: int | None = 3600
    cookie_path: str = Field("/", min_length=1)
    cookie_domain: str | None = None
    cookie_secure: bool = False
    cookie_httponly: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    token_lifetime_seconds: int = Field(3600, gt=0)
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    celery_broker_url: str = "amqp://guest:guest@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6379/0"
    redis_url: str = "redis://localhost:6379/0"
    pipeline_daily_limit: int = Field(2, gt=0)
    pipeline_min_interval_seconds: int = Field(3600, gt=0)

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cookie_samesite")
    @classmethod
    def validate_samesite(cls, v: str) -> str:
        """Validate and normalize samesite value."""
        v = v.lower().strip()
        if v not in {"lax", "strict", "none"}:
            raise ValueError(f'cookie_samesite must be "lax", "strict", or "none", got "{v}"')
        return v

    @field_validator(
        "cookie_secure",
        "cookie_httponly",
        "mail_enabled",
        "smtp_use_tls",
        "smtp_use_ssl",
        "smtp_validate_certs",
    )
    @classmethod
    def validate_bool_from_env(cls, v: str | bool) -> bool:
        """Handle boolean values from .env file."""
        if isinstance(v, bool):
            return v
        return v.lower() in ("true", "1", "yes", "on")

    @field_validator("cookie_domain")
    @classmethod
    def validate_domain(cls, v: str | None) -> str | None:
        """Validate domain format if provided."""
        if v and v.strip():
            v = v.strip().lower()
            if v.startswith(("http://", "https://")):
                raise ValueError("cookie_domain should not include protocol")
            return v
        return None

    @field_validator("frontend_base_url")
    @classmethod
    def validate_frontend_base_url(cls, value: str) -> str:
        normalized = value.strip().rstrip("/")
        if not normalized.startswith(("http://", "https://")):
            raise ValueError("frontend_base_url must include protocol")
        return normalized

    @field_validator("admin_api_prefix")
    @classmethod
    def validate_admin_api_prefix(cls, value: str) -> str:
        normalized = "/" + "/".join(segment for segment in value.strip().split("/") if segment)
        if normalized == "/":
            raise ValueError("admin_api_prefix must include at least one path segment")
        return normalized

    @field_validator("cookie_max_age", "token_lifetime_seconds")
    @classmethod
    def validate_positive_int(cls, v: int | None) -> int | None:
        """Ensure positive values for timeouts."""
        if v is not None and v <= 0:
            raise ValueError("Value must be positive")
        return v

    @model_validator(mode="after")
    def validate_debug_settings(self) -> Settings:
        """Additional validation for debug mode."""
        if self.debug:
            import warnings

            if not self.auth_secret or len(self.auth_secret) < 10:
                warnings.warn(
                    "Using weak AUTH_SECRET in debug mode. Consider using a stronger secret in production.",
                    UserWarning,
                    stacklevel=2,
                )

            if self.cookie_secure:
                warnings.warn(
                    "cookie_secure=True in debug mode. Cookies will only be sent over HTTPS.", UserWarning, stacklevel=2
                )

        return self

    @model_validator(mode="after")
    def validate_settings(self) -> Settings:
        if not self.auth_secret:
            msg = "AUTH_SECRET must be configured."
            raise ValueError(msg)

        missing_fields = [
            field_name
            for field_name in (
                "postgres_host",
                "postgres_user",
                "postgres_password",
                "postgres_db",
            )
            if not getattr(self, field_name)
        ]
        if missing_fields:
            missing = ", ".join(missing_fields)
            msg = f"Missing required PostgreSQL settings: {missing}."
            raise ValueError(msg)

        if self.mail_enabled:
            missing_mail_fields = [
                field_name
                for field_name in ("smtp_host", "mail_sender_email")
                if not getattr(self, field_name)
            ]
            if missing_mail_fields:
                missing = ", ".join(missing_mail_fields)
                raise ValueError(f"Missing required mail settings: {missing}.")

            if self.smtp_use_tls and self.smtp_use_ssl:
                raise ValueError("smtp_use_tls and smtp_use_ssl cannot both be True.")

        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError(
                'cookie_secure must be True when cookie_samesite is "none". This is a browser security requirement.'
            )

        if not self.cookie_path.startswith("/"):
            raise ValueError('cookie_path must start with "/"')

        if self.debug and self.cookie_secure:
            import warnings

            warnings.warn(
                "cookie_secure=True in debug mode may prevent cookies from being set when testing locally without HTTPS",
                UserWarning,
                stacklevel=2,
            )

        if self.cors_origins:
            for origin in self.cors_origin_list:
                if not origin.startswith(("http://", "https://")):
                    raise ValueError(f"CORS origin must include protocol: {origin}")

        return self

    @property
    def admin_api_prefix_path(self) -> str:
        return self.admin_api_prefix

    @property
    def admin_api_entry(self) -> str:
        return f"{self.admin_api_prefix_path}/"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def build_postgres_dsn(self, *, driver: str = "postgresql+asyncpg", database: str | None = None) -> str:
        user = quote(self.postgres_user, safe="")
        password = quote(self.postgres_password, safe="")
        database_name = quote(database or self.postgres_db, safe="")
        return f"{driver}://{user}:{password}@{self.postgres_host}:{self.postgres_port}/{database_name}"

    def get_database_url(self) -> str:
        return self.build_postgres_dsn()


@lru_cache
def get_settings() -> Settings:
    return Settings()
