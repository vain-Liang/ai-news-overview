from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = 'AI News Review'
    debug: bool = True

    postgres_host: str = ''
    postgres_port: int = 5432
    postgres_user: str = ''
    postgres_password: str = ''
    postgres_db: str = ''

    auth_secret: str = ''
    access_token_lifetime_seconds: int = 3600
    cors_origins: str = 'http://127.0.0.1:5173,http://localhost:5173'

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    @model_validator(mode='after')
    def validate_settings(self) -> Settings:
        if not self.auth_secret:
            msg = 'AUTH_SECRET must be configured.'
            raise ValueError(msg)

        missing_fields = [
            field_name
            for field_name in (
                'postgres_host',
                'postgres_user',
                'postgres_password',
                'postgres_db',
            )
            if not getattr(self, field_name)
        ]
        if missing_fields:
            missing = ', '.join(missing_fields)
            msg = f'Missing required PostgreSQL settings: {missing}.'
            raise ValueError(msg)

        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]

    def build_postgres_dsn(self, *, driver: str = 'postgresql+asyncpg', database: str | None = None) -> str:
        user = quote(self.postgres_user, safe='')
        password = quote(self.postgres_password, safe='')
        database_name = quote(database or self.postgres_db, safe='')
        return f'{driver}://{user}:{password}@{self.postgres_host}:{self.postgres_port}/{database_name}'

    def get_database_url(self) -> str:
        return self.build_postgres_dsn()


@lru_cache
def get_settings() -> Settings:
    return Settings()
