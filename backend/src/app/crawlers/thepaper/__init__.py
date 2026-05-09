from __future__ import annotations

from crawl4ai import CacheMode, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

SOURCE_KEY = "thepaper"
URL = "https://www.thepaper.cn/"
ALLOWED_DOMAINS = ["thepaper.cn"]
MAX_RESULTS = 40

# Primary: the 4th .ppreport__FKc19 section's second child div holds the main
# article list. Each li contains an <a> with title + href, and optional
# time/heat elements.
_PPREPORT_FIELDS = [
    {"name": "title", "selector": "a", "type": "text"},
    {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
    {"name": "summary", "selector": ".summary, .desc, .abstract, p", "type": "text", "default": ""},
    {"name": "author", "selector": ".source, .author, .from, .channel", "type": "text", "default": ""},
    {"name": "published_at", "selector": "time, .time, .date, .pubtime, .timer", "type": "text", "default": ""},
]

_GENERIC_FIELDS = [
    {"name": "title", "selector": "h1 a, h2 a, h3 a, h4 a, strong a, a", "type": "text"},
    {"name": "url", "selector": "h1 a, h2 a, h3 a, h4 a, strong a, a", "type": "attribute", "attribute": "href"},
    {"name": "summary", "selector": "p, .summary, .desc, .abstract, .txt, .info", "type": "text", "default": ""},
    {"name": "author", "selector": ".source, .author, .media, .from, .channel", "type": "text", "default": ""},
    {"name": "published_at", "selector": "time, .time, .date, .pubtime, .timer", "type": "text", "default": ""},
]

_SCHEMAS = [
    {
        "name": "ThePaperPpreportSection",
        # 4th .ppreport__FKc19 block > 2nd child div (main article list)
        "baseSelector": "div.ppreport__FKc19:nth-child(4) > div:nth-child(2) li",
        "fields": _PPREPORT_FIELDS,
    },
    {
        "name": "ThePaperHomepage",
        "baseSelector": ".news_li, .pd_item, .newsContent li, .cont_item, li, article",
        "fields": _GENERIC_FIELDS,
    },
    {
        "name": "ThePaperSections",
        "baseSelector": ".index_list li, .index_news li, .channel-news li, li",
        "fields": _GENERIC_FIELDS,
    },
]

_COMMON: dict = dict(
    wait_until="domcontentloaded",
    # Wait for the ppreport section to appear before extracting
    wait_for="css:div.ppreport__FKc19",
    page_timeout=45_000,
    remove_overlay_elements=True,
    remove_consent_popups=True,
    simulate_user=True,
    magic=True,
    verbose=False,
)


def _matcher(url: str) -> bool:
    return "thepaper.cn" in url


def build_run_configs(bypass_cache: bool = True) -> list[CrawlerRunConfig]:
    """Return [primary_config, *fallback_configs] for The Paper."""
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
