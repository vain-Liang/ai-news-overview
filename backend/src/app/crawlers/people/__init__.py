from __future__ import annotations

from crawl4ai import CacheMode, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

SOURCE_KEY = "peoples"
URL = "https://www.people.com.cn/"
ALLOWED_DOMAINS = ["people.com.cn"]
MAX_RESULTS = 40

_LINK_FIELDS = [
    {"name": "title", "selector": "a", "type": "text"},
    {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
]

# Four well-identified sections observed in the live homepage DOM (after JS renders):
#   #newsContent .news-item → scrolling news ticker (dynamically populated)
#   #rmw_news li            → 人民日报热榜 hot-ranked list (dynamically populated)
#   ul.blist1 li            → 要闻播报 breaking news broadcast
#   #rm_aq ul.list1 li      → main headlines column
_SCHEMAS = [
    {
        "name": "PeopleNewsTicker",
        "baseSelector": "#newsContent .news-item",
        "fields": _LINK_FIELDS,
    },
    {
        "name": "PeopleHotList",
        "baseSelector": "ul#rmw_news li",
        "fields": _LINK_FIELDS,
    },
    {
        "name": "PeopleBroadcast",
        "baseSelector": "ul.blist1 li",
        "fields": _LINK_FIELDS,
    },
    {
        "name": "PeopleHeadlines",
        "baseSelector": "#rm_aq ul.list1 li",
        "fields": _LINK_FIELDS,
    },
]

_COMMON: dict = dict(
    wait_until="domcontentloaded",
    wait_for="css:#rmw_news",
    page_timeout=60_000,
    remove_overlay_elements=True,
    remove_consent_popups=True,
    simulate_user=True,
    magic=True,
    verbose=False,
)


def _matcher(url: str) -> bool:
    return "people.com.cn" in url


def build_run_configs(bypass_cache: bool = True) -> list[CrawlerRunConfig]:
    """Return [primary_config, *fallback_configs] for People's Daily."""
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
