from __future__ import annotations

from crawl4ai import CacheMode, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

SOURCE_KEY = "ifeng"
URL = "https://www.ifeng.com/"
ALLOWED_DOMAINS = ["ifeng.com"]
MAX_RESULTS = 40

_LINK_FIELDS = [
    {"name": "title", "selector": "a", "type": "attribute", "attribute": "title"},
    {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
]

_SCHEMAS = [
    {
        # News list items inside every index_news_list_p78SU block,
        # including the active-tab section (index_tabBodyItemActive_G8pON).
        "name": "IfengNewsList",
        "baseSelector": "div.index_news_list_p78SU p.index_news_list_p_5zOEF",
        "fields": _LINK_FIELDS,
    },
    {
        # Hero slider captions at the top of the page.
        "name": "IfengSlider",
        "baseSelector": "p.index_title_o-NFI",
        "fields": _LINK_FIELDS,
    },
    {
        # Section topic headers (h3 anchoring each news cluster).
        "name": "IfengSectionHeaders",
        "baseSelector": "h3.index_list_title_1x9s7",
        "fields": _LINK_FIELDS,
    },
]

_COMMON: dict = dict(
    wait_until="domcontentloaded",
    wait_for="css:div.index_news_list_p78SU p.index_news_list_p_5zOEF",
    page_timeout=45_000,
    remove_overlay_elements=True,
    remove_consent_popups=True,
    simulate_user=True,
    magic=True,
    verbose=False,
)


def _matcher(url: str) -> bool:
    return "ifeng.com" in url


def build_run_configs(bypass_cache: bool = True) -> list[CrawlerRunConfig]:
    """Return [primary_config, *fallback_configs] for iFeng."""
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
