from __future__ import annotations

from typing import Any

from fastapi import Depends
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate

from app.core.config import get_settings

settings = get_settings()


def get_email_route_dependencies() -> list[Any]:
    if settings.debug:
        return []

    limiter = Limiter(
        Rate(settings.email_rate_limit_times, Duration.SECOND * settings.email_rate_limit_seconds)
    )
    return [Depends(RateLimiter(limiter=limiter))]
