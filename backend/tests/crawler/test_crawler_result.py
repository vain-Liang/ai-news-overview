"""
Integration test: crawl all configured news sites and persist structured results.

Mark: network  (requires live internet access and a browser)

Run:
    pytest tests/crawler/test_crawler_result.py -v -m network

Output:
    tests/crawler/data/crawler_result.json  — one entry per NewsArticle across all sites
"""
from __future__ import annotations

import dataclasses
import json
import warnings
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent / "data"
RESULT_FILE = DATA_DIR / "crawler_result.json"


@pytest.mark.network
@pytest.mark.asyncio
async def test_crawl_all_sites_and_save() -> None:
    """Crawl every configured site and save structured NewsArticle data to JSON."""
    from app.crawlers.fetcher import SITE_MODULES
    from app.crawlers.news_crawler import crawl_all_sites

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    articles = await crawl_all_sites(bypass_cache=True)

    by_source: dict[str, int] = {}
    for a in articles:
        by_source[a.source] = by_source.get(a.source, 0) + 1

    for source in SITE_MODULES:
        if by_source.get(source, 0) == 0:
            warnings.warn(f"No articles fetched from '{source}' — check network or site config", stacklevel=2)

    assert articles, "Crawler returned no articles from any site — check network or site configs"

    payload = [dataclasses.asdict(a) for a in articles]
    RESULT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nTotal articles: {len(articles)}")
    for source, count in sorted(by_source.items()):
        print(f"  {source}: {count}")
    print(f"Saved → {RESULT_FILE}")

    assert len(articles) >= 10, (
        f"Only {len(articles)} articles total — expected ≥10 across all sites"
    )
    assert all(a.title for a in articles), "Some articles have empty titles"
    assert all(a.url.startswith("http") for a in articles), "Some articles have invalid URLs"
    assert all(a.id for a in articles), "Some articles are missing IDs"
