"""
Two-stage test for the QQ News crawler schema.

Stage 1 (network, slow):  fetch live page via crawl4ai with js_code → save rendered HTML.
                           The js_code intercepts window.open and injects data-news-url
                           attributes before the HTML is captured, so Stage 2 can work
                           offline without re-running JavaScript.

Stage 2 (offline, fast):  apply the QQ News CSS schema to the saved HTML → verify extraction.

Run both in order:
    pytest tests/crawler/test_qqnews_extractor.py -v -m network   # fetch + save
    pytest tests/crawler/test_qqnews_extractor.py -v              # verify schema
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "qqnews.html"

_QQNEWS_URL = "https://news.qq.com/tag/aEWqxLtdgmQ="


@pytest.mark.network
@pytest.mark.asyncio
async def test_fetch_qqnews_and_save() -> None:
    """Crawl the QQ News tag page (with URL-intercept JS) and save rendered HTML."""
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

    from app.crawlers.qqnews import _JS_INTERCEPT_URLS

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    browser_cfg = BrowserConfig(headless=True, verbose=False, java_script_enabled=True)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="load",
        wait_for="css:div.DvkELQjnpo87qySKQ8y4",
        js_code=_JS_INTERCEPT_URLS,
        delay_before_return_html=1.0,
        page_timeout=60_000,
    )

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        result = await crawler.arun(url=_QQNEWS_URL, config=run_cfg)

    assert result.success, f"Crawl failed: {result.error_message}"
    assert result.html, "No HTML content returned from crawl"

    DATA_FILE.write_text(result.html, encoding="utf-8")
    size_kb = DATA_FILE.stat().st_size // 1024
    has_urls = "data-news-url" in result.html
    print(f"\nSaved {size_kb} KB → {DATA_FILE}  (data-news-url attrs present: {has_urls})")


def test_qqnews_schema_extracts_articles() -> None:
    """Apply the QQ News CSS schema to a saved HTML snapshot and verify extraction."""
    if not DATA_FILE.exists():
        pytest.skip(
            f"No HTML snapshot found — run test_fetch_qqnews_and_save first.\n"
            f"Checked: {DATA_FILE}"
        )

    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

    from app.crawlers.qqnews import ALLOWED_DOMAINS, MAX_RESULTS, SOURCE_KEY, _SCHEMA
    from app.crawlers.parser import parse_articles

    html = DATA_FILE.read_text(encoding="utf-8")
    assert len(html) > 1_000, (
        f"Saved HTML is suspiciously small ({len(html)} bytes) — re-run the fetch test"
    )

    strategy = JsonCssExtractionStrategy(_SCHEMA)
    raw = strategy.extract(url=_QQNEWS_URL, html_content=html)
    items: list[dict] = json.loads(raw) if isinstance(raw, str) else (raw or [])

    assert items, (
        "Schema extracted zero items — the base selector 'div.DvkELQjnpo87qySKQ8y4' "
        "matched nothing. QQ News may have changed its CSS class names; "
        "re-inspect the page and update _SCHEMA in src/app/crawlers/qqnews/__init__.py."
    )

    articles = parse_articles(
        items,
        source=SOURCE_KEY,
        allowed_domains=ALLOWED_DOMAINS,
        base_url=_QQNEWS_URL,
        limit=MAX_RESULTS,
    )

    print(f"\nRaw items: {len(items)}  →  valid articles: {len(articles)}")
    for article in articles[:5]:
        print(f"  title:  {article.title[:70]!r}")
        print(f"  url:    {article.url}")
        print(f"  author: {article.author!r}")

    assert len(articles) >= 5, (
        f"Only {len(articles)} valid articles from {len(items)} raw items — "
        "expected ≥5 from a real QQ News tag page"
    )
    assert all(a.title for a in articles), "Some articles have empty titles"

    urls_with_scheme = [a for a in articles if a.url.startswith("http")]
    assert urls_with_scheme, (
        "No articles have a URL — data-news-url attributes may be missing from the "
        "HTML snapshot. Re-run test_fetch_qqnews_and_save to regenerate it with the "
        "window.open intercept JS active."
    )
    assert all(
        "qq.com" in a.url for a in urls_with_scheme
    ), "Some URLs point outside qq.com — check ALLOWED_DOMAINS filtering"
