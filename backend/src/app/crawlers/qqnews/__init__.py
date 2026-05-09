from __future__ import annotations

from crawl4ai import CacheMode, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

SOURCE_KEY = "qqnews"
URL = "https://news.qq.com/tag/aEWqxLtdgmQ="
ALLOWED_DOMAINS = ["qq.com"]
MAX_RESULTS = 40

# Intercept window.open calls triggered by clicking each news item,
# then store the captured URL as a data-news-url attribute so the
# CSS extraction schema can read it like any other attribute.
_JS_INTERCEPT_URLS = """
(async () => {
    const originalOpen = window.open;
    const items = Array.from(
        document.querySelectorAll("div.x5SWgotKcljdkZxEwAne")
    );
    for (const item of items) {
        let captured = "";
        window.open = (url) => { captured = url || ""; return { focus: () => {} }; };
        item.click();
        await new Promise(r => setTimeout(r, 60));
        if (captured) item.setAttribute("data-news-url", captured);
    }
    window.open = originalOpen;
})();
"""

_SCHEMA = {
    "name": "QQNewsTagList",
    "baseSelector": "div.DvkELQjnpo87qySKQ8y4",
    "fields": [
        {
            "name": "title",
            "selector": "div.fQ9IcyBwrd6Hkz4zJLt7",
            "type": "text",
        },
        {
            "name": "summary",
            "selector": "div.nKu2aZDBSGYUYr7ZQATk",
            "type": "text",
            "default": "",
        },
        {
            "name": "author",
            "selector": "a._NxoLvTvNaorH25TsFwV span",
            "type": "text",
            "default": "",
        },
        {
            "name": "url",
            "selector": "div.x5SWgotKcljdkZxEwAne",
            "type": "attribute",
            "attribute": "data-news-url",
            "default": "",
        },
    ],
}

_COMMON: dict = dict(
    wait_until="load",
    wait_for="css:div.DvkELQjnpo87qySKQ8y4",
    js_code=_JS_INTERCEPT_URLS,
    delay_before_return_html=1.0,
    page_timeout=60_000,
    remove_overlay_elements=True,
    remove_consent_popups=True,
    simulate_user=True,
    magic=True,
    verbose=False,
)


def _matcher(url: str) -> bool:
    return "qq.com" in url


def build_run_configs(bypass_cache: bool = True) -> list[CrawlerRunConfig]:
    """Return a single config for QQ News tag pages."""
    cache_mode = CacheMode.BYPASS if bypass_cache else CacheMode.ENABLED
    return [
        CrawlerRunConfig(
            url_matcher=_matcher,
            cache_mode=cache_mode,
            extraction_strategy=JsonCssExtractionStrategy(_SCHEMA),
            **_COMMON,
        )
    ]
