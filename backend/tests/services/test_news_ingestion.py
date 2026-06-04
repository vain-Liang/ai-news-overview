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
    test_batch = [
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

    async def fake_batch(*_args, **_kwargs) -> list[NewsArticle]:
        return test_batch

    monkeypatch.setattr("app.services.news_service.crawl_all_sites", fake_batch)
    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        await ingest_homepage_news(session, persist_dir=str(tmp_path))


async def test_ingest_homepage_news_can_skip_vector_indexing(monkeypatch, tmp_path) -> None:
    articles = [
        NewsArticle(
            id="manual-news-1",
            url="https://www.news.cn/manual/1.htm",
            source="xinhua",
            title="手动抓取新闻只保存元数据",
            summary="向量索引应由后台任务处理。",
            author="新华社",
            published_at="2026-04-19 11:00",
            crawled_at="2026-04-19T11:30:00+00:00",
        )
    ]

    async def fake_crawl_all_sites(*_args, **_kwargs) -> list[NewsArticle]:
        return articles

    def fail_resolve_store(*_args, **_kwargs):
        raise AssertionError("manual ingestion should not initialize the vector store")

    monkeypatch.setattr("app.services.news_service.crawl_all_sites", fake_crawl_all_sites)
    monkeypatch.setattr("app.services.news_service._resolve_store", fail_resolve_store)

    from app.core.database import async_session_maker

    async with async_session_maker() as session:
        result = await ingest_homepage_news(session, persist_dir=str(tmp_path), index_vectors=False)
        assert result.crawled_count == 1
        assert result.metadata_stored_count == 1
        assert result.vector_stored_count == 0
        assert result.by_source == {"xinhua": 1}

    async with async_session_maker() as session:
        record = await session.get(NewsArticleRecord, "manual-news-1")
        assert record is not None
        assert record.title == "手动抓取新闻只保存元数据"


async def test_semantic_search_with_topics_filter(monkeypatch) -> None:
    """Verify that topic filtering routes through to the vector store correctly.

    Uses a fake store to avoid calling the embedding API, while still exercising
    the full service -> retriever -> store call chain with topic propagation.
    """
    from app.vectorstore.base import SearchResult, VectorStoreBase

    class FakeStore(VectorStoreBase):
        def __init__(self) -> None:
            self.last_call: dict = {}
            self._data = {
                "tech-1": SearchResult(id="tech-1", document="AI tech", metadata={"tags": "|technology|ai|"}, distance=0.1),
                "econ-1": SearchResult(id="econ-1", document="GDP economy", metadata={"tags": "|economy|gdp|"}, distance=0.2),
            }

        def store_articles(self, articles: list[dict]) -> None:
            pass

        def search_articles(
            self,
            query: str,
            n_results: int = 10,
            source: str | None = None,
            topics: list[str] | None = None,
        ) -> list[SearchResult]:
            self.last_call = {"query": query, "n_results": n_results, "source": source, "topics": topics}
            if topics:
                return [r for r in self._data.values() if any(f"|{t}|" in r.metadata.get("tags", "") for t in topics)]
            return list(self._data.values())

    fake_store = FakeStore()
    monkeypatch.setattr("app.services.news_service.get_vector_store", lambda: fake_store)

    from app.core.database import async_session_maker
    from app.repositories.news import upsert_news_metadata

    articles = [
        NewsArticle(
            id="tech-1",
            url="https://www.news.cn/tech/1.htm",
            source="xinhua",
            title="人工智能技术迎来新突破",
            summary="多家科技公司发布最新AI模型。",
            author="新华社",
            published_at="2026-04-20 08:00",
            crawled_at="2026-04-20T08:00:00+00:00",
            tags=["technology", "ai"],
        ),
        NewsArticle(
            id="econ-1",
            url="https://www.news.cn/econ/1.htm",
            source="xinhua",
            title="一季度GDP增速超预期",
            summary="国家统计局数据显示一季度经济增速达5.3%。",
            author="新华社",
            published_at="2026-04-20 09:00",
            crawled_at="2026-04-20T09:00:00+00:00",
            tags=["economy", "gdp"],
        ),
    ]

    async with async_session_maker() as session:
        await upsert_news_metadata(session, articles)

    async with async_session_maker() as session:
        results = await semantic_search_news(
            session,
            query="新闻",
            n_results=5,
            topics=["economy"],
        )

    assert fake_store.last_call["topics"] == ["economy"]
    assert "economy" in fake_store.last_call["query"]
    result_ids = {r["id"] for r in results}
    assert "econ-1" in result_ids
    assert "tech-1" not in result_ids
