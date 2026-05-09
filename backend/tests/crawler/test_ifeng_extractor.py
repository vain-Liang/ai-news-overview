"""
Two-stage test for the iFeng crawler schema.

Stage 1 (network, slow):  fetch live page via crawl4ai → save rendered HTML
Stage 2 (offline, fast):  apply iFeng CSS schemas to saved HTML → verify articles

Run both in order:
    pytest tests/crawler/test_ifeng_extractor.py -v -m network   # fetch + save
    pytest tests/crawler/test_ifeng_extractor.py -v              # verify schema
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "ifeng.html"
# Fallback: HTML saved during development (tracked in the repo)
_DEV_HTML = Path(__file__).parents[2] / "src/app/crawlers/ifeng/ifeng.html"

_IFENG_URL = "https://www.ifeng.com/"


@pytest.mark.network
@pytest.mark.asyncio
async def test_fetch_ifeng_homepage_and_save() -> None:
    """Crawl www.ifeng.com and save the rendered HTML to tests/crawler/data/ifeng.html."""
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    browser_cfg = BrowserConfig(headless=True, verbose=False, java_script_enabled=True)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        wait_for="css:div.index_news_list_p78SU p.index_news_list_p_5zOEF",
        page_timeout=60_000,
    )

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        result = await crawler.arun(url=_IFENG_URL, config=run_cfg)

    assert result.success, f"Crawl failed: {result.error_message}"
    assert result.html, "No HTML content returned from crawl"

    DATA_FILE.write_text(result.html, encoding="utf-8")
    size_kb = DATA_FILE.stat().st_size // 1024
    print(f"\nSaved {size_kb} KB → {DATA_FILE}")


def _resolve_html_file() -> Path | None:
    """Return the first available HTML snapshot, or None."""
    if DATA_FILE.exists():
        return DATA_FILE
    if _DEV_HTML.exists():
        return _DEV_HTML
    return None


def test_ifeng_schema_extracts_articles() -> None:
    """Apply each iFeng CSS schema to saved HTML and assert valid article extraction."""
    html_file = _resolve_html_file()
    if html_file is None:
        pytest.skip(
            f"No HTML snapshot found — run test_fetch_ifeng_homepage_and_save first.\n"
            f"Checked: {DATA_FILE}, {_DEV_HTML}"
        )

    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

    from app.crawlers.ifeng import ALLOWED_DOMAINS, MAX_RESULTS, _SCHEMAS
    from app.crawlers.parser import parse_articles

    html = html_file.read_text(encoding="utf-8")
    assert len(html) > 1_000, (
        f"Saved HTML is suspiciously small ({len(html)} bytes) — re-run the fetch test"
    )

    for schema in _SCHEMAS:
        strategy = JsonCssExtractionStrategy(schema)
        raw = strategy.extract(url=_IFENG_URL, html_content=html)
        items: list[dict] = json.loads(raw) if isinstance(raw, str) else (raw or [])

        articles = parse_articles(items, "ifeng", ALLOWED_DOMAINS, _IFENG_URL, limit=MAX_RESULTS)

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
        f"No schema extracted valid articles from {html_file.name}.\n"
        f"Schemas tried: {[s['name'] for s in _SCHEMAS]}\n"
        "Open the saved HTML and inspect the article list structure, "
        "then update baseSelector in src/app/crawlers/ifeng/__init__.py."
    )
