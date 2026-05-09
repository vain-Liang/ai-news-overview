from __future__ import annotations

from crawl4ai import CacheMode, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

SOURCE_KEY = "xinhua"
URL = "https://www.news.cn"
ALLOWED_DOMAINS = ["news.cn", "xinhuanet.com"]
MAX_RESULTS = 40

# Primary: .depth-cont holds the top-story list (~18 items, clean titles, absolute URLs).
# Each li: <li><a href="abs_url">title [<i>wrapped</i>]</a></li>
# Some li have two <a>s (topic-header + real article); a:last-of-type picks the article.
_DEPTH_FIELDS = [
    {"name": "title", "selector": "a:last-of-type", "type": "text"},
    {"name": "url", "selector": "a:last-of-type", "type": "attribute", "attribute": "href"},
    {"name": "summary", "selector": ".tit, .txt, .desc", "type": "text", "default": ""},
    {"name": "published_at", "selector": "time, .time, .date, .pubtime", "type": "text", "default": ""},
]

# Fallback: text-list containers scattered across the page; may include relative URLs
# (resolved by parser._normalize_url) and tag links filtered via :not(.tagRed).
_LIST_FIELDS = [
    {"name": "title", "selector": "a:not(.tagRed)", "type": "text"},
    {"name": "url", "selector": "a:not(.tagRed)", "type": "attribute", "attribute": "href"},
    {"name": "summary", "selector": ".tit, .txt, .desc", "type": "text", "default": ""},
    {"name": "published_at", "selector": "time, .time, .date, .pubtime", "type": "text", "default": ""},
]

_SCHEMAS = [
    {
        "name": "XinhuaDepthCont",
        "baseSelector": ".depth-cont li",
        "fields": _DEPTH_FIELDS,
    },
    {
        "name": "XinhuaTextListFallback",
        "baseSelector": "div.list.list-txt li, div.list.list-txt.dot li",
        "fields": _LIST_FIELDS,
    },
]

_COMMON: dict = dict(
    wait_until="domcontentloaded",
    wait_for="css:.depth-cont",
    page_timeout=45_000,
    remove_overlay_elements=True,
    remove_consent_popups=True,
    simulate_user=True,
    magic=True,
    verbose=False,
)


def _matcher(url: str) -> bool:
    return "news.cn" in url or "xinhuanet.com" in url


def build_run_configs(bypass_cache: bool = True) -> list[CrawlerRunConfig]:
    """Return [primary_config, *fallback_configs] for Xinhua."""
    cache_mode = CacheMode.BYPASS if bypass_cache else CacheMode.ENABLED
    return [
        CrawlerRunConfig(
            url_matcher=_matcher,
            cache_mode=cache_mode,
            extraction_strategy=JsonCssExtractionStrategy(schema),
            **_COMMON,
        )
        for schema in _SCHEMAS
    ]
