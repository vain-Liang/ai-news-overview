from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.core.config import LlmProvider


class NewsIngestRequest(BaseModel):
    sources: list[str] | None = None
    bypass_cache: bool = True


class NewsIngestResponse(BaseModel):
    crawled_count: int
    metadata_stored_count: int
    vector_stored_count: int
    by_source: dict[str, int]


class NewsSearchResult(BaseModel):
    id: str
    url: str
    source: str
    title: str
    summary: str = ""
    author: str = ""
    published_at: str = ""
    crawled_at: str | None = None
    distance: float | None = None


class NewsSummarizeRequest(BaseModel):
    query: str = Field(min_length=1)
    n_results: int = Field(default=6, ge=1, le=20)
    source: str | None = None
    provider: LlmProvider | None = None


class NewsSummarizeResponse(BaseModel):
    query: str
    summary: str
    results: list[NewsSearchResult] = Field(default_factory=list)


class HomepageNewsSourceGroup(BaseModel):
    source: str
    articles: list[NewsSearchResult] = Field(default_factory=list)


class HomepageNewsResponse(BaseModel):
    groups: list[HomepageNewsSourceGroup] = Field(default_factory=list)


class NewsArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    source: str
    title: str
    summary: str
    author: str
    published_at_raw: str
    crawled_at: str


class NewsSearchResponse(BaseModel):
    query: str
    results: list[NewsSearchResult] = Field(default_factory=list)
