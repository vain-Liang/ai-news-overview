from __future__ import annotations

from sqlalchemy import select

from app.crawlers.schemas import NewsArticle
from app.models.news_article import NewsArticleRecord
from app.services.news_service import ingest_homepage_news, semantic_search_news


async def test_ingest_homepage_news_persists_metadata_and_vectors(monkeypatch, tmp_path) -> None:
    async def fake_crawl_all_sites(*_args, **_kwargs) -> list[NewsArticle]:
        return [
            NewsArticle(
                id="news-1",
                url="https://www.news.cn/politics/20260419/1.htm",
                source="xinhua",
                title="中国经济在一季度保持稳定增长",
                summary="多个关键指标显示经济运行延续回升向好态势。",
                author="新华社记者",
                published_at="2026-04-19 08:00",
                crawled_at="2026-04-19T08:30:00+00:00",
            ),
            NewsArticle(
                id="news-2",
                url="https://www.ifeng.com/c/8sample2",
                source="ifeng",
                title="多地推出新举措提振消费市场活力",
                summary="地方消费政策继续加码，带动线下客流回暖。",
                author="凤凰网财经",
                published_at="2026-04-19 09:00",
                crawled_at="2026-04-19T09:30:00+00:00",
            ),
        ]

    monkeypatch.setattr("app.services.news_service.crawl_all_sites", fake_crawl_all_sites)

    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        result = await ingest_homepage_news(session, persist_dir=str(tmp_path))
        assert result.crawled_count == 2
        assert result.metadata_stored_count == 2
        assert result.vector_stored_count == 2
        assert result.by_source == {"xinhua": 1, "ifeng": 1}

    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        records = list((await session.scalars(select(NewsArticleRecord).order_by(NewsArticleRecord.id))).all())
        assert len(records) == 2
        assert records[0].title

        search_results = await semantic_search_news(session, query="经济 增长", persist_dir=str(tmp_path))
        assert search_results
        assert search_results[0]["id"] in {"news-1", "news-2"}
        assert "distance" in search_results[0]


async def test_ingest_homepage_news_upserts_existing_metadata(monkeypatch, tmp_path) -> None:
    first_batch = [
        NewsArticle(
            id="news-1",
            url="https://www.people.com.cn/n1/2026/0419/c1000-0001.html",
            source="peoples",
            title="消费潜力持续释放",
            summary="首版摘要",
            author="人民网",
            published_at="2026-04-19 10:00",
            crawled_at="2026-04-19T10:30:00+00:00",
        )
    ]
    second_batch = [
        NewsArticle(
            id="news-1",
            url="https://www.people.com.cn/n1/2026/0419/c1000-0001.html",
            source="peoples",
            title="消费潜力持续释放",
            summary="更新后的摘要",
            author="人民网",
            published_at="2026-04-19 10:00",
            crawled_at="2026-04-19T11:00:00+00:00",
        )
    ]

    async def fake_first(*_args, **_kwargs) -> list[NewsArticle]:
        return first_batch

    async def fake_second(*_args, **_kwargs) -> list[NewsArticle]:
        return second_batch

    monkeypatch.setattr("app.services.news_service.crawl_all_sites", fake_first)
    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        await ingest_homepage_news(session, persist_dir=str(tmp_path))

    monkeypatch.setattr("app.services.news_service.crawl_all_sites", fake_second)
    async with async_session_maker() as session:
        await ingest_homepage_news(session, persist_dir=str(tmp_path))

    async with async_session_maker() as session:
        record = await session.scalar(select(NewsArticleRecord).where(NewsArticleRecord.id == "news-1"))
        assert record is not None
        assert record.summary == "更新后的摘要"
