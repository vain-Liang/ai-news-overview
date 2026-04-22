from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.auth.fastapi_users import current_active_user
from app.core.database import get_async_session
from app.core.exceptions import ServiceUnavailableError
from app.schemas.news import (  # noqa: TC001
    HomepageNewsResponse,
    HomepageNewsSourceGroup,
    NewsIngestRequest,
    NewsIngestResponse,
    NewsSearchResponse,
    NewsSearchResult,
    NewsSummarizeRequest,
    NewsSummarizeResponse,
)
from app.services.news_service import ingest_homepage_news, list_homepage_news
from app.services.rag_service import generate_news_rag_summary

logger = logging.getLogger(__name__)

news_router = APIRouter(prefix="/news", tags=["news"])


@news_router.post("/ingest", response_model=NewsIngestResponse)
async def ingest_news(
    payload: NewsIngestRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _user=Depends(current_active_user),
) -> NewsIngestResponse:
    result = await ingest_homepage_news(
        session,
        sources=payload.sources,
        bypass_cache=payload.bypass_cache,
    )
    return NewsIngestResponse(**result.to_dict())


@news_router.get("/search", response_model=NewsSearchResponse)
async def search_news(
    query: Annotated[str, Query(min_length=1)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
    n_results: Annotated[int, Query(ge=1, le=50)] = 10,
    source: str | None = None,
) -> NewsSearchResponse:
    del query, session, n_results, source
    raise ServiceUnavailableError("News search is temporarily unavailable.")


@news_router.get("/homepage", response_model=HomepageNewsResponse)
async def get_homepage_news(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    per_source: Annotated[int, Query(ge=1, le=20)] = 8,
) -> HomepageNewsResponse:
    groups = await list_homepage_news(session, per_source=per_source)
    typed_groups = [
        HomepageNewsSourceGroup(
            source=group["source"],
            articles=[NewsSearchResult.model_validate(item) for item in group["articles"]],
        )
        for group in groups
    ]
    return HomepageNewsResponse(groups=typed_groups)


@news_router.post("/summarize", response_model=NewsSummarizeResponse)
async def summarize_news(
    payload: NewsSummarizeRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _user=Depends(current_active_user),
) -> NewsSummarizeResponse:
    try:
        result = await generate_news_rag_summary(
            session,
            query=payload.query,
            n_results=payload.n_results,
            source=payload.source,
            provider=payload.provider,
        )
    except ValueError as exc:
        raise ServiceUnavailableError(str(exc)) from exc

    return NewsSummarizeResponse(
        query=result.query,
        summary=result.summary,
        results=[NewsSearchResult.model_validate(item) for item in result.results],
    )
