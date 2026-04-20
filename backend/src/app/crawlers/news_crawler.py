from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from datetime import UTC, datetime
from typing import Any, cast
from urllib.parse import urljoin, urlparse

from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig, JsonCssExtractionStrategy

from .extractors import SITE_CONFIGS
from .schemas import NewsArticle

logger = logging.getLogger(__name__)

_BROWSER_CONFIG = BrowserConfig(
    headless=True,
    verbose=False,
    viewport_width=1440,
    viewport_height=900,
    java_script_enabled=True,
)

_SKIP_EXACT_TITLES = {
    "english",
    "about",
    "app",
    "客户端",
    "手机版",
    "登录",
    "注册",
    "更多",
    "视频",
    "图片",
    "直播",
    "专题",
    "地方",
    "资讯",
    "要闻",
    "滚动",
    "新闻",
}


def _article_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _normalize_url(href: str, source: str) -> str:
    href = (href or "").strip()
    if not href or href.startswith(("javascript:", "mailto:", "#")):
        return ""
    base = SITE_CONFIGS[source]["url"]
    return urljoin(base, href)


def _is_allowed_domain(url: str, source: str) -> bool:
    hostname = urlparse(url).hostname or ""
    return any(hostname == domain or hostname.endswith(f".{domain}") for domain in SITE_CONFIGS[source]["allowed_domains"])


def _is_probable_article_title(title: str) -> bool:
    normalized = _normalize_whitespace(title)
    if not normalized:
        return False
    if normalized.lower() in _SKIP_EXACT_TITLES:
        return False
    if len(normalized) < 8:
        return False
    cjk_chars = sum("\u4e00" <= char <= "\u9fff" for char in normalized)
    return cjk_chars >= 4 or len(normalized.split()) >= 4


def _parse_articles(raw: list[dict[str, Any]], source: str, *, limit: int) -> list[NewsArticle]:
    now = datetime.now(UTC).isoformat()
    articles: list[NewsArticle] = []
    seen_urls: set[str] = set()

    for item in raw:
        title = _normalize_whitespace(str(item.get("title") or ""))
        url = _normalize_url(str(item.get("url") or ""), source)
        if not _is_probable_article_title(title) or not url or url in seen_urls:
            continue
        if not _is_allowed_domain(url, source):
            continue

        summary = _normalize_whitespace(str(item.get("summary") or ""))
        author = _normalize_whitespace(str(item.get("author") or ""))
        published_at = _normalize_whitespace(str(item.get("published_at") or ""))
        if summary == title:
            summary = ""

        seen_urls.add(url)
        articles.append(
            NewsArticle(
                id=_article_id(url),
                url=url,
                source=source,
                title=title,
                summary=summary,
                author=author,
                published_at=published_at,
                crawled_at=now,
                tags=[],
            )
        )
        if len(articles) >= limit:
            break

    return articles


async def _extract_raw_items(crawler: AsyncWebCrawler, source: str, *, bypass_cache: bool) -> list[dict[str, Any]]:
    cfg = SITE_CONFIGS[source]
    schemas = [cfg["schema"], *cfg.get("fallback_schemas", [])]

    for schema in schemas:
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS if bypass_cache else CacheMode.ENABLED,
            extraction_strategy=JsonCssExtractionStrategy(schema),
            wait_until="domcontentloaded",
            wait_for=cfg["wait_for"],
            page_timeout=cfg["page_timeout"],
            remove_overlay_elements=True,
            remove_consent_popups=True,
            simulate_user=True,
            magic=True,
            verbose=False,
        )
        arun = cast("Any", crawler.arun)
        result: Any = await arun(url=cfg["url"], config=run_config)
        if not result.success or not result.extracted_content:
            logger.warning("Failed extraction for %s with schema %s: %s", source, schema["name"], result.error_message)
            continue

        try:
            payload = json.loads(result.extracted_content)
        except json.JSONDecodeError:
            logger.warning("Invalid extraction JSON for %s with schema %s", source, schema["name"])
            continue

        if isinstance(payload, list) and payload:
            return payload

    return []


async def crawl_site(source: str, bypass_cache: bool = True) -> list[NewsArticle]:
    """Crawl a single news site and return structured homepage articles."""
    if source not in SITE_CONFIGS:
        raise ValueError(f"Unsupported source: {source}")

    cfg = SITE_CONFIGS[source]

    async with AsyncWebCrawler(config=_BROWSER_CONFIG) as crawler:
        raw = await _extract_raw_items(crawler, source, bypass_cache=bypass_cache)

    articles = _parse_articles(raw, source, limit=cfg["max_results"])
    logger.info("Crawled %d articles from %s", len(articles), source)
    return articles


async def crawl_all_sites(
    sources: list[str] | None = None,
    *,
    bypass_cache: bool = True,
) -> list[NewsArticle]:
    """Crawl all configured news sites concurrently."""
    selected_sources = list(sources or SITE_CONFIGS)
    invalid_sources = sorted(set(selected_sources) - set(SITE_CONFIGS))
    if invalid_sources:
        invalid = ", ".join(invalid_sources)
        raise ValueError(f"Unsupported sources: {invalid}")

    tasks = [crawl_site(source, bypass_cache=bypass_cache) for source in selected_sources]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    articles: list[NewsArticle] = []
    for source, result in zip(selected_sources, results, strict=False):
        if isinstance(result, BaseException):
            logger.error("Error crawling %s: %s", source, result)
            continue
        articles.extend(result)
    return articles
