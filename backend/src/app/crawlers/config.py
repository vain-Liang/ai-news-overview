"""
Crawl4AI unified browser/crawler configs with 3-tier anti-bot fallback.

Tier 1 — Normal:     Plain headless browser, no special evasion.
Tier 2 — Stealth:    playwright-stealth fingerprint masking + navigator override.
Tier 3 — Undetected: undetected-chrome adapter for deep bot-detection bypass.

Each heavier tier is only used when the previous one fails, keeping the
common-case fast while providing progressively stronger evasion as fallback.

Site cookies are loaded from `Settings` at crawl time via `build_site_cookies()`.
Each site's cookie env var (e.g. CRAWLER_COOKIE_XINHUA) holds a semicolon-delimited
"name=value" string; these are parsed into Playwright cookie dicts and combined so
that Playwright routes each cookie to the correct domain automatically.
"""

from __future__ import annotations

from dataclasses import dataclass

from crawl4ai import BrowserConfig


# ---------------------------------------------------------------------------
# Browser configs (crawler-level; require a separate AsyncWebCrawler instance)
# ---------------------------------------------------------------------------

# Tier 1: standard headless Chrome, randomised UA, basic performance tweaks.
browser_normal = BrowserConfig(
    headless=True,
    verbose=False,
    user_agent_mode="random",
    avoid_ads=True,
    avoid_css=True,
)

# Tier 2: playwright-stealth modifies browser fingerprints to defeat basic
# bot detectors.  Keep ads/css blocking for performance.
browser_stealth = BrowserConfig(
    headless=True,
    verbose=False,
    enable_stealth=True,
    user_agent_mode="random",
    avoid_ads=True,
    avoid_css=True,
)

# Tier 3: undetected-chrome adapter with deep-level patches for Cloudflare /
# TLS-fingerprint-aware services.  Ads/CSS blocking is omitted because the
# adapter manages its own request interception layer.
browser_undetected = BrowserConfig(
    browser_type="undetected",
    headless=True,
    verbose=False,
    extra_args=[
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
    ],
)


# ---------------------------------------------------------------------------
# Per-tier CrawlerRunConfig augments
# These kwargs are merged into each site's CrawlerRunConfig on retry so that
# the site-specific extraction schema is preserved while evasion is enhanced.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class TierAugment:
    run_kwargs: dict


# Tier 1: no extra run-level evasion (site modules supply their own settings).
TIER_NORMAL_AUGMENT = TierAugment(run_kwargs={})

# Tier 2: force navigator override on top of whatever the site config already
# sets; the stealth browser handles fingerprint patching at the browser level.
TIER_STEALTH_AUGMENT = TierAugment(
    run_kwargs=dict(
        magic=True,
        simulate_user=True,
        override_navigator=True,
    )
)

# Tier 3: longer wait lets the undetected-chrome adapter finish its patches
# before extraction begins; full evasion flags are also set.
TIER_UNDETECTED_AUGMENT = TierAugment(
    run_kwargs=dict(
        magic=True,
        simulate_user=True,
        override_navigator=True,
        wait_time=5.0,
    )
)

# Ordered list of (BrowserConfig, TierAugment) — index 0 = first attempt,
# index 1 = stealth retry, index 2 = undetected retry (final by default).
ANTIBOT_TIERS: list[tuple[BrowserConfig, TierAugment]] = [
    (browser_normal, TIER_NORMAL_AUGMENT),
    (browser_stealth, TIER_STEALTH_AUGMENT),
    (browser_undetected, TIER_UNDETECTED_AUGMENT),
]

# ---------------------------------------------------------------------------
# Site cookie helpers
# ---------------------------------------------------------------------------


def _parse_cookie_string(raw: str, domain: str) -> list[dict]:
    """Parse a semicolon-delimited "name=value" cookie string into Playwright dicts."""
    cookies = []
    for pair in raw.split(";"):
        pair = pair.strip()
        if not pair or "=" not in pair:
            continue
        name, _, value = pair.partition("=")
        name = name.strip()
        value = value.strip()
        if name:
            cookies.append({"name": name, "value": value, "domain": domain, "path": "/"})
    return cookies


def build_site_cookies() -> list[dict]:
    """Return combined Playwright cookie dicts for all configured sites.

    Reads each CRAWLER_COOKIE_<SITE> env var from Settings.  Empty vars are
    skipped, so this returns [] when no cookies are configured at all.
    Each cookie dict carries a domain field so Playwright routes it only to
    the matching site — no cross-site leakage.
    """
    from app.core.config import get_settings  # lazy import to avoid circular dependency

    settings = get_settings()
    # Explicit mapping: Settings field suffix → cookie domain.
    # The "peoples" source key uses the "people" settings field for readability.
    field_to_domain: dict[str, str] = {
        "xinhua": ".news.cn",
        "thepaper": ".thepaper.cn",
        "people": ".people.com.cn",
        "ifeng": ".ifeng.com",
        "qqnews": ".qq.com",
    }
    all_cookies: list[dict] = []
    for field_suffix, domain in field_to_domain.items():
        raw: str = getattr(settings, f"crawler_cookie_{field_suffix}", "")
        if raw.strip():
            all_cookies.extend(_parse_cookie_string(raw, domain))
    return all_cookies
