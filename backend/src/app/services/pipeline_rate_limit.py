from __future__ import annotations

import logging
import time
from datetime import date
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status

from app.auth.fastapi_users import current_active_user
from app.core.config import get_settings
from app.models.user import User  # noqa: TC001

logger = logging.getLogger(__name__)


async def _enforce(endpoint: str, user_id: str) -> None:
    settings = get_settings()
    redis: aioredis.Redis = aioredis.from_url(settings.redis_url, decode_responses=True)

    today = date.today().isoformat()
    count_key = f"pipeline:rl:{user_id}:{endpoint}:count:{today}"
    last_key = f"pipeline:rl:{user_id}:{endpoint}:last"

    try:
        last_ts_str: str | None = await redis.get(last_key)
        if last_ts_str is not None:
            elapsed = time.time() - float(last_ts_str)
            if elapsed < settings.pipeline_min_interval_seconds:
                wait = int(settings.pipeline_min_interval_seconds - elapsed)
                logger.warning("Rate limit: interval not met user=%s endpoint=%s wait=%ds", user_id, endpoint, wait)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {wait} seconds before triggering again.",
                    headers={"Retry-After": str(wait)},
                )

        count_str: str | None = await redis.get(count_key)
        if count_str is not None and int(count_str) >= settings.pipeline_daily_limit:
            logger.warning("Rate limit: daily cap reached user=%s endpoint=%s limit=%d", user_id, endpoint, settings.pipeline_daily_limit)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily pipeline trigger limit reached ({settings.pipeline_daily_limit} per day).",
            )

        now = time.time()
        seconds_until_midnight = 86400 - (int(now) % 86400)
        async with redis.pipeline(transaction=False) as pipe:
            pipe.incr(count_key)
            pipe.expire(count_key, seconds_until_midnight)
            pipe.set(last_key, str(now), ex=settings.pipeline_min_interval_seconds)
            await pipe.execute()
    finally:
        await redis.aclose()


def pipeline_rate_limit(endpoint: str):
    """Return a FastAPI dependency that enforces per-user rate limits for a pipeline endpoint."""

    async def _dependency(user: Annotated[User, Depends(current_active_user)]) -> User:
        await _enforce(endpoint, str(user.id))
        return user

    return _dependency
