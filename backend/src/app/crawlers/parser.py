from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin, urlparse

from .schemas import NewsArticle

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


def _normalize_url(href: str, base_url: str) -> str:
    href = (href or "").strip()
    if not href or href.startswith(("javascript:", "mailto:", "#")):
        return ""
    return urljoin(base_url, href)


def _is_allowed_domain(url: str, allowed_domains: list[str]) -> bool:
    hostname = urlparse(url).hostname or ""
    return any(hostname == d or hostname.endswith(f".{d}") for d in allowed_domains)


def _is_probable_article_title(title: str) -> bool:
    normalized = _normalize_whitespace(title)
    if not normalized:
        return False
    if normalized.lower() in _SKIP_EXACT_TITLES:
        return False
    if len(normalized) < 8:
        return False
    cjk_chars = sum("一" <= char <= "鿿" for char in normalized)
    return cjk_chars >= 4 or len(normalized.split()) >= 4


def parse_articles(
    raw: list[dict[str, Any]],
    source: str,
    allowed_domains: list[str],
    base_url: str,
    *,
    limit: int,
) -> list[NewsArticle]:
    """Convert raw scraped dicts into validated, deduplicated NewsArticle objects."""
    now = datetime.now(UTC).isoformat()
    articles: list[NewsArticle] = []
    seen_urls: set[str] = set()

    for item in raw:
        title = _normalize_whitespace(str(item.get("title") or ""))
        url = _normalize_url(str(item.get("url") or ""), base_url)
        if not _is_probable_article_title(title) or not url or url in seen_urls:
            continue
        if not _is_allowed_domain(url, allowed_domains):
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
