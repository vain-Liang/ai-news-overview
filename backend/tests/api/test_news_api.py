from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from app.services.news_service import NewsIngestionResult
from app.services.rag_service import NewsRagSummaryResult

if TYPE_CHECKING:
    from httpx import AsyncClient


async def authenticate_client(client: AsyncClient) -> dict[str, str]:
    email = f"news-api-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"

    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "username": f"news-user-{uuid.uuid4().hex[:6]}",
            "nickname": "News API User",
        },
    )
    assert register_response.status_code == 201

    login_response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200

    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


async def test_ingest_news_endpoint_requires_auth(client) -> None:
    response = await client.post("/news/ingest", json={"sources": ["xinhua"], "bypass_cache": True})

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Unauthorized"


async def test_ingest_news_endpoint(client, monkeypatch) -> None:
    async def fake_ingest(*_args, **_kwargs) -> NewsIngestionResult:
        return NewsIngestionResult(
            crawled_count=5,
            metadata_stored_count=5,
            vector_stored_count=5,
            by_source={"xinhua": 2, "ifeng": 3},
        )

    monkeypatch.setattr("app.api.v1.routes.news.ingest_homepage_news", fake_ingest)
    headers = await authenticate_client(client)

    response = await client.post(
        "/news/ingest",
        json={"sources": ["xinhua", "ifeng"], "bypass_cache": True},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == {
        "crawled_count": 5,
        "metadata_stored_count": 5,
        "vector_stored_count": 5,
        "by_source": {"xinhua": 2, "ifeng": 3},
    }


async def test_search_news_endpoint_returns_503_while_paused(client) -> None:
    response = await client.get("/news/search", params={"query": "测试", "n_results": 5, "source": "xinhua"})

    assert response.status_code == 503
    assert response.json()["error"]["message"] == "News search is temporarily unavailable."


async def test_homepage_news_endpoint(client, monkeypatch) -> None:
    async def fake_list(*_args, **kwargs) -> list[dict]:
        assert kwargs["per_source"] == 6
        return [
            {
                "source": "xinhua",
                "articles": [
                    {
                        "id": "news-1",
                        "url": "https://www.news.cn/sample",
                        "source": "xinhua",
                        "title": "新华社标题",
                        "summary": "摘要",
                        "author": "作者",
                        "published_at": "2026-04-20 10:00",
                        "crawled_at": "2026-04-20T10:05:00+00:00",
                        "distance": None,
                    }
                ],
            },
            {"source": "ifeng", "articles": []},
        ]

    monkeypatch.setattr("app.api.v1.routes.news.list_homepage_news", fake_list)

    response = await client.get("/news/homepage", params={"per_source": 6})

    assert response.status_code == 200
    payload = response.json()
    assert payload["groups"][0]["source"] == "xinhua"
    assert payload["groups"][0]["articles"][0]["url"] == "https://www.news.cn/sample"


async def test_summarize_news_endpoint_requires_auth(client) -> None:
    response = await client.post("/news/summarize", json={"query": "总结今日经济新闻"})

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Unauthorized"


async def test_summarize_news_endpoint(client, monkeypatch) -> None:
    async def fake_summary(*_args, **kwargs) -> NewsRagSummaryResult:
        assert kwargs["provider"] == "openai"
        return NewsRagSummaryResult(
            query="总结今日经济新闻",
            summary="总体摘要\n- 要点1\n- 要点2",
            results=[
                {
                    "id": "news-1",
                    "url": "https://www.news.cn/sample",
                    "source": "xinhua",
                    "title": "测试新闻标题",
                    "summary": "测试摘要",
                    "author": "测试作者",
                    "published_at": "2026-04-19 12:00",
                    "crawled_at": "2026-04-19T12:30:00+00:00",
                    "distance": 0.12,
                }
            ],
        )

    monkeypatch.setattr("app.api.v1.routes.news.generate_news_rag_summary", fake_summary)
    headers = await authenticate_client(client)

    response = await client.post(
        "/news/summarize",
        json={"query": "总结今日经济新闻", "n_results": 5, "source": "xinhua", "provider": "openai"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["query"] == "总结今日经济新闻"
    assert "总体摘要" in payload["summary"]
    assert payload["results"][0]["source"] == "xinhua"


async def test_summarize_news_endpoint_accepts_provider_override(client, monkeypatch) -> None:
    async def fake_summary(*_args, **kwargs) -> NewsRagSummaryResult:
        assert kwargs["provider"] == "openai"
        return NewsRagSummaryResult(query="测试", summary="OpenAI 摘要", results=[])

    monkeypatch.setattr("app.api.v1.routes.news.generate_news_rag_summary", fake_summary)
    headers = await authenticate_client(client)

    response = await client.post(
        "/news/summarize",
        json={"query": "测试", "provider": "openai"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["summary"] == "OpenAI 摘要"


async def test_summarize_news_endpoint_returns_503_without_api_key(client, monkeypatch) -> None:
    async def fake_summary(*_args, **_kwargs) -> NewsRagSummaryResult:
        raise ValueError("DEEPSEEK_API_KEY is not configured.")

    monkeypatch.setattr("app.api.v1.routes.news.generate_news_rag_summary", fake_summary)
    headers = await authenticate_client(client)

    response = await client.post("/news/summarize", json={"query": "测试"}, headers=headers)

    assert response.status_code == 503
    assert response.json()["error"]["message"] == "DEEPSEEK_API_KEY is not configured."
