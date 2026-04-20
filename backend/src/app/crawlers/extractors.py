from __future__ import annotations

from typing import Any, TypedDict


class SiteConfig(TypedDict):
    url: str
    allowed_domains: list[str]
    wait_for: str
    page_timeout: int
    max_results: int
    schema: dict[str, Any]
    fallback_schemas: list[dict[str, Any]]


def _schema(name: str, base_selector: str) -> dict[str, Any]:
    return {
        "name": name,
        "baseSelector": base_selector,
        "fields": [
            {"name": "title", "selector": "h1 a, h2 a, h3 a, h4 a, strong a, a", "type": "text"},
            {"name": "url", "selector": "h1 a, h2 a, h3 a, h4 a, strong a, a", "type": "attribute", "attribute": "href"},
            {"name": "summary", "selector": "p, .summary, .desc, .abstract, .txt, .info", "type": "text", "default": ""},
            {"name": "author", "selector": ".source, .author, .media, .from, .channel", "type": "text", "default": ""},
            {"name": "published_at", "selector": "time, .time, .date, .pubtime, .timer", "type": "text", "default": ""},
        ],
    }


SITE_CONFIGS: dict[str, SiteConfig] = {
    "xinhua": {
        "url": "https://www.news.cn",
        "allowed_domains": ["news.cn", "xinhuanet.com"],
        "wait_for": "css:a[href]",
        "page_timeout": 45_000,
        "max_results": 40,
        "schema": _schema("XinhuaHomepage", ".news-item, .itemBox, li.clearfix, .item, li, article"),
        "fallback_schemas": [
            _schema("XinhuaSections", ".news, .section, .list, .headlines li, .recommend li, li"),
        ],
    },
    "thepaper": {
        "url": "https://www.thepaper.cn/",
        "allowed_domains": ["thepaper.cn"],
        "wait_for": "css:a[href]",
        "page_timeout": 45_000,
        "max_results": 40,
        "schema": _schema("ThePaperHomepage", ".news_li, .pd_item, .newsContent li, .cont_item, li, article"),
        "fallback_schemas": [
            _schema("ThePaperSections", ".index_list li, .index_news li, .channel-news li, li"),
        ],
    },
    "peoples": {
        "url": "https://www.people.com.cn/",
        "allowed_domains": ["people.com.cn"],
        "wait_for": "css:a[href]",
        "page_timeout": 45_000,
        "max_results": 40,
        "schema": _schema("PeopleHomepage", ".ej_list_box li, .p2j_list li, .news_box li, li.clearfix, li, article"),
        "fallback_schemas": [
            _schema("PeopleSections", ".layout li, .list li, .section li, li"),
        ],
    },
    "ifeng": {
        "url": "https://www.ifeng.com/",
        "allowed_domains": ["ifeng.com"],
        "wait_for": "css:a[href]",
        "page_timeout": 45_000,
        "max_results": 40,
        "schema": _schema("IfengHomepage", ".feed-card-item, .index_feedItem, .newsStream-item, .item_info, li, article"),
        "fallback_schemas": [
            _schema("IfengSections", ".news-stream li, .list li, .channel-list li, li"),
        ],
    },
    "qqnews": {
        "url": "https://news.qq.com/tag/aEWqxLtdgmQ=",
        "allowed_domains": ["qq.com"],
        "wait_for": "css:a[href]",
        "page_timeout": 45_000,
        "max_results": 40,
        "schema": _schema("QQNewsHomepage", ".item, .listItem, .news-list-item, .List-item, li, article"),
        "fallback_schemas": [
            _schema("QQNewsSections", ".channel-list li, .list li, .module li, li"),
        ],
    },
}
