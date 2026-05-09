"""
Two-stage test for the ThePaper crawler schema.

Stage 1 (network, slow):  fetch live page via crawl4ai → save rendered HTML
Stage 2 (offline, fast):  apply ThePaper CSS schemas to saved HTML → verify articles

Run both in order:
    pytest tests/crawler/test_thepaper_extractor.py -v -m network   # fetch + save
    pytest tests/crawler/test_thepaper_extractor.py -v              # verify schema
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "thepaper.html"

_THEPAPER_URL = "https://www.thepaper.cn/"


@pytest.mark.network
@pytest.mark.asyncio
async def test_fetch_thepaper_homepage_and_save() -> None:
    """Crawl www.thepaper.cn and save the rendered HTML to tests/crawler/data/thepaper.html."""
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    browser_cfg = BrowserConfig(headless=True, verbose=False, java_script_enabled=True)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        wait_for="css:div.ppreport__FKc19",
        page_timeout=60_000,
    )

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        result = await crawler.arun(url=_THEPAPER_URL, config=run_cfg)

    assert result.success, f"Crawl failed: {result.error_message}"
    assert result.html, "No HTML content returned from crawl"

    DATA_FILE.write_text(result.html, encoding="utf-8")
    size_kb = DATA_FILE.stat().st_size // 1024
    print(f"\nSaved {size_kb} KB → {DATA_FILE}")


def test_thepaper_schema_extracts_articles() -> None:
    """Apply each ThePaper CSS schema to saved HTML and assert valid article extraction."""
    if not DATA_FILE.exists():
        pytest.skip(f"Data file not found — run test_fetch_thepaper_homepage_and_save first: {DATA_FILE}")

    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

    from app.crawlers.parser import parse_articles
    from app.crawlers.thepaper import ALLOWED_DOMAINS, MAX_RESULTS, _SCHEMAS

    html = DATA_FILE.read_text(encoding="utf-8")
    assert len(html) > 1_000, (
        f"Saved HTML is suspiciously small ({len(html)} bytes) — re-run the fetch test"
    )

    for schema in _SCHEMAS:
        strategy = JsonCssExtractionStrategy(schema)
        raw = strategy.extract(url=_THEPAPER_URL, html_content=html)
        items: list[dict] = json.loads(raw) if isinstance(raw, str) else (raw or [])

        articles = parse_articles(items, "thepaper", ALLOWED_DOMAINS, _THEPAPER_URL, limit=MAX_RESULTS)

        if not articles:
            continue

        print(f"\nSchema '{schema['name']}': {len(articles)} articles extracted")
        for article in articles[:5]:
            print(f"  title: {article.title[:70]!r}")
            print(f"  url:   {article.url}")

        assert len(articles) >= 5, (
            f"Schema '{schema['name']}' only extracted {len(articles)} articles — "
            "expected ≥5 from a real homepage"
        )
        assert all(a.title for a in articles), "Some articles have empty titles"
        assert all(a.url.startswith("http") for a in articles), (
            "Some article URLs are not absolute — check _normalize_url in parser.py"
        )
        return  # first schema that produces results passes the test

    pytest.fail(
        f"No schema extracted valid articles from {DATA_FILE.name}.\n"
        f"Schemas tried: {[s['name'] for s in _SCHEMAS]}\n"
        "Open the saved HTML and inspect the article list structure, "
        "then update baseSelector in src/app/crawlers/thepaper/__init__.py."
    )
