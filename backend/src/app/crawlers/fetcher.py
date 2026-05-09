from __future__ import annotations

import copy
import json
import logging
import types
from typing import Any

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter

from . import ifeng, people, qqnews, thepaper, xinhua
from .config import ANTIBOT_TIERS, TierAugment, build_site_cookies

logger = logging.getLogger(__name__)

# Registry of all supported site modules.  Each module must export:
#   SOURCE_KEY: str, URL: str, ALLOWED_DOMAINS: list[str], MAX_RESULTS: int
#   build_run_configs(bypass_cache: bool) -> list[CrawlerRunConfig]
SITE_MODULES: dict[str, types.ModuleType] = {
    xinhua.SOURCE_KEY: xinhua,
    thepaper.SOURCE_KEY: thepaper,
    people.SOURCE_KEY: people,
    ifeng.SOURCE_KEY: ifeng,
    qqnews.SOURCE_KEY: qqnews,
}


def _make_dispatcher() -> MemoryAdaptiveDispatcher:
    return MemoryAdaptiveDispatcher(
        memory_threshold_percent=85.0,
        check_interval=1.0,
        max_session_permit=5,
        rate_limiter=RateLimiter(
            base_delay=(1.0, 3.0),
            max_delay=60.0,
            max_retries=2,
        ),
    )


def _validate_payload(extracted_content: str | None) -> list[dict[str, Any]] | None:
    """Parse extraction JSON and return the list, or None if invalid/empty."""
    if not extracted_content:
        return None
    try:
        payload = json.loads(extracted_content)
    except json.JSONDecodeError:
        return None
    if isinstance(payload, list) and payload:
        return payload
    return None


def _augment_run_config(cfg: CrawlerRunConfig, augment: TierAugment) -> CrawlerRunConfig:
    """Return a copy of cfg with the tier's extra evasion kwargs applied."""
    if not augment.run_kwargs:
        return cfg
    new_cfg = copy.copy(cfg)
    for key, value in augment.run_kwargs.items():
        setattr(new_cfg, key, value)
    return new_cfg


async def _run_extraction_rounds(
    crawler: AsyncWebCrawler,
    pending_urls: list[str],
    selected: dict[str, types.ModuleType],
    url_to_source: dict[str, str],
    bypass_cache: bool,
    augment: TierAugment,
    tier_label: str,
) -> tuple[dict[str, list[dict[str, Any]]], list[str]]:
    """Run extraction-schema rounds for *pending_urls* using *crawler*.

    Tier 1 (normal) tries all schema rounds per site so extraction fallbacks
    are exhausted before escalating to a heavier browser.  Tiers 2/3 only run
    round 0: bot-detection failures are browser-level, so alternate schemas
    add no value until the site is actually reachable.

    Returns (newly_resolved, still_failing_urls).
    """
    raw_results: dict[str, list[dict[str, Any]]] = {}
    still_failing = list(pending_urls)

    is_retry_tier = bool(augment.run_kwargs)
    max_rounds = (
        1
        if is_retry_tier
        else max(len(mod.build_run_configs(bypass_cache)) for mod in selected.values())
    )

    for round_idx in range(max_rounds):
        if not still_failing:
            break

        round_configs = []
        for mod in selected.values():
            if mod.URL not in still_failing:
                continue
            cfgs = mod.build_run_configs(bypass_cache)
            if round_idx < len(cfgs):
                round_configs.append(_augment_run_config(cfgs[round_idx], augment))

        if not round_configs:
            break

        logger.info(
            "%s round %d: crawling %d URL(s) with %d config(s)",
            tier_label,
            round_idx,
            len(still_failing),
            len(round_configs),
        )

        results = await crawler.arun_many(
            urls=still_failing,
            config=round_configs,
            dispatcher=_make_dispatcher(),
        )

        next_failing: list[str] = []
        for result in results:
            source = url_to_source.get(result.url)
            if source is None:
                logger.warning("Unexpected URL in results: %s", result.url)
                continue

            if not result.success:
                logger.warning(
                    "%s round %d: crawl failed for %s: %s",
                    tier_label,
                    round_idx,
                    source,
                    result.error_message,
                )
                next_failing.append(result.url)
                continue

            payload = _validate_payload(result.extracted_content)
            if payload is None:
                logger.warning(
                    "%s round %d: no valid content for %s", tier_label, round_idx, source
                )
                next_failing.append(result.url)
                continue

            raw_results[source] = payload
            logger.info(
                "%s round %d: extracted %d items from %s",
                tier_label,
                round_idx,
                len(payload),
                source,
            )

        still_failing = next_failing

    return raw_results, still_failing


async def fetch_all_raw_articles(
    sources: list[str] | None = None,
    *,
    bypass_cache: bool = True,
) -> dict[str, list[dict[str, Any]]]:
    """Batch-crawl all (or selected) news sites with 3-tier anti-bot fallback.

    Tier 1 (normal browser): tries all extraction-schema rounds per site.
    Tier 2 (stealth):        retries failing URLs with playwright-stealth.
    Tier 3 (undetected):     retries still-failing URLs with undetected-chrome.

    Heavier tiers are only initialized when there are actually failing URLs,
    keeping the common-case fast and unaffected by the retry overhead.

    Returns a mapping of source key → list of raw article dicts.
    """
    selected: dict[str, types.ModuleType] = (
        {k: SITE_MODULES[k] for k in sources} if sources else dict(SITE_MODULES)
    )

    url_to_source: dict[str, str] = {mod.URL: key for key, mod in selected.items()}
    pending_urls: list[str] = list(url_to_source)
    raw_results: dict[str, list[dict[str, Any]]] = {}

    # Load per-site cookies once; they are injected into every tier's browser
    # config so Playwright routes each cookie to the correct domain automatically.
    site_cookies = build_site_cookies()

    tier_labels = ["normal", "stealth", "undetected"]

    for tier_idx, (browser_cfg, augment) in enumerate(ANTIBOT_TIERS):
        if not pending_urls:
            break

        label = tier_labels[tier_idx]
        if tier_idx > 0:
            logger.info(
                "Anti-bot tier %d (%s): retrying %d failing URL(s)",
                tier_idx,
                label,
                len(pending_urls),
            )

        active_modules = {k: v for k, v in selected.items() if v.URL in pending_urls}

        # Inject site cookies into the browser config for this tier.
        # Shallow-copy the config object and set cookies so constructor-only
        # internal attrs (e.g. browser_hint) don't cause TypeError.
        if site_cookies:
            effective_browser_cfg = copy.copy(browser_cfg)
            effective_browser_cfg.cookies = site_cookies
        else:
            effective_browser_cfg = browser_cfg

        async with AsyncWebCrawler(config=effective_browser_cfg) as crawler:
            resolved, pending_urls = await _run_extraction_rounds(
                crawler=crawler,
                pending_urls=pending_urls,
                selected=active_modules,
                url_to_source=url_to_source,
                bypass_cache=bypass_cache,
                augment=augment,
                tier_label=label,
            )
        raw_results.update(resolved)

    if pending_urls:
        exhausted = [url_to_source[u] for u in pending_urls if u in url_to_source]
        logger.error("All anti-bot tiers exhausted, no content for: %s", exhausted)

    return raw_results
