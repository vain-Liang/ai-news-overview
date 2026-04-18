from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "AI News Overview"
    debug: bool = True

    postgres_host: str = ""
    postgres_port: int = 5432
    postgres_user: str = ""
    postgres_password: str = ""
    postgres_db: str = ""

    auth_secret: str = ""

    cookie_name: str = "fastapiusersauth"
    cookie_max_age: int | None = 3600
    cookie_path: str = Field("/", min_length=1)
    cookie_domain: str | None = None
    cookie_secure: bool = False
    cookie_httponly: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    token_lifetime_seconds: int = Field(3600, gt=0)

    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

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

    @field_validator("cookie_secure", "cookie_httponly")
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
            # Basic domain validation
            v = v.strip().lower()
            if v.startswith(("http://", "https://")):
                raise ValueError("cookie_domain should not include protocol")
            return v
        return None

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

            # Security warnings for development
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

            # Show current configuration
            print("Debug mode enabled:")
            print(f"  - Cookie secure: {self.cookie_secure}")
            print(f"  - Cookie samesite: {self.cookie_samesite}")
            print(f"  - Cookie HTTP only: {self.cookie_httponly}")

        return self

    @model_validator(mode="after")
    def validate_settings(self) -> Settings:
        if not self.auth_secret:
            msg = "AUTH_SECRET must be configured."
            raise ValueError(msg)

        # PostgreSQL validation
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

        # Cookie-specific validations
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError(
                'cookie_secure must be True when cookie_samesite is "none". This is a browser security requirement.'
            )

        if not self.cookie_path.startswith("/"):
            raise ValueError('cookie_path must start with "/"')

        if self.debug and self.cookie_secure:
            import warnings

            warnings.warn(
                "cookie_secure=True in debug mode may prevent cookies from being set "
                "when testing locally without HTTPS",
                UserWarning,
                stacklevel=2,
            )

        # Validate CORS origins
        if self.cors_origins:
            for origin in self.cors_origin_list:
                if not origin.startswith(("http://", "https://")):
                    raise ValueError(f"CORS origin must include protocol: {origin}")

        return self

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
