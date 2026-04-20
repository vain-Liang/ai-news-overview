from __future__ import annotations

import tempfile

from app.crawlers.extractors import SITE_CONFIGS
from app.crawlers.news_crawler import _parse_articles, crawl_all_sites
from app.crawlers.schemas import NewsArticle
from app.vectorstore.chroma import search_articles, store_articles


def test_site_configs_have_required_keys() -> None:
    for name, cfg in SITE_CONFIGS.items():
        assert "url" in cfg, f"{name} missing url"
        assert "schema" in cfg, f"{name} missing schema"
        assert "allowed_domains" in cfg, f"{name} missing allowed_domains"
        assert "wait_for" in cfg, f"{name} missing wait_for"
        assert cfg["schema"]["baseSelector"]
        assert cfg["schema"]["fields"]


def test_parse_articles_filters_navigation_links() -> None:
    raw = [
        {"title": "English", "url": "/english", "summary": ""},
        {"title": "做完心理测试，他被骗了14万", "url": "https://news.ifeng.com/c/8ifeng123", "summary": "警方提醒警惕新骗局"},
        {"title": "资讯", "url": "https://www.ifeng.com/news", "summary": ""},
        {"title": "过短", "url": "https://news.ifeng.com/c/short", "summary": ""},
    ]

    articles = _parse_articles(raw, "ifeng", limit=10)

    assert len(articles) == 1
    assert articles[0].title == "做完心理测试，他被骗了14万"
    assert articles[0].summary == "警方提醒警惕新骗局"


async def test_crawl_all_sites_validates_sources() -> None:
    try:
        await crawl_all_sites(["unknown-source"])
    except ValueError as exc:
        assert "Unsupported sources" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid source")


def test_store_and_search_articles() -> None:
    articles = [
        NewsArticle(
            id="abc123",
            url="https://www.news.cn",
            source="xinhua",
            title="Test headline about economy",
            summary="The economy is doing well this quarter.",
            author="Reporter A",
            published_at="2026-04-19",
            crawled_at="2026-04-19T00:00:00+00:00",
        )
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        count = store_articles(articles, persist_dir=tmpdir)
        assert count == 1

        results = search_articles("economy news", n_results=1, persist_dir=tmpdir)
        assert len(results) == 1
        assert results[0]["source"] == "xinhua"
