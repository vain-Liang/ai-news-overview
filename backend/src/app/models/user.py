from __future__ import annotations

from datetime import datetime  # noqa: TC003

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column  # noqa: TC002

from app.models.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "user"

    username: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pending_email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
