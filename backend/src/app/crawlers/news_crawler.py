from __future__ import annotations

import logging

from .fetcher import SITE_MODULES, fetch_all_raw_articles
from .parser import parse_articles
from .schemas import NewsArticle

logger = logging.getLogger(__name__)


async def crawl_site(source: str, bypass_cache: bool = True) -> list[NewsArticle]:
    """Crawl a single news site and return structured homepage articles."""
    if source not in SITE_MODULES:
        raise ValueError(f"Unsupported source: {source}")
    raw_map = await fetch_all_raw_articles([source], bypass_cache=bypass_cache)
    raw = raw_map.get(source, [])
    mod = SITE_MODULES[source]
    articles = parse_articles(raw, source, mod.ALLOWED_DOMAINS, mod.URL, limit=mod.MAX_RESULTS)
    logger.info("Crawled %d articles from %s", len(articles), source)
    return articles


async def crawl_all_sites(
    sources: list[str] | None = None,
    *,
    bypass_cache: bool = True,
) -> list[NewsArticle]:
    """Batch-crawl all configured news sites and return structured articles."""
    selected_sources = list(sources or SITE_MODULES)
    invalid = sorted(set(selected_sources) - set(SITE_MODULES))
    if invalid:
        raise ValueError(f"Unsupported sources: {', '.join(invalid)}")

    raw_map = await fetch_all_raw_articles(selected_sources, bypass_cache=bypass_cache)

    articles: list[NewsArticle] = []
    for source in selected_sources:
        raw = raw_map.get(source, [])
        if not raw:
            logger.warning("No articles fetched from %s", source)
            continue
        mod = SITE_MODULES[source]
        parsed = parse_articles(raw, source, mod.ALLOWED_DOMAINS, mod.URL, limit=mod.MAX_RESULTS)
        logger.info("Parsed %d articles from %s", len(parsed), source)
        articles.extend(parsed)

    return articles
