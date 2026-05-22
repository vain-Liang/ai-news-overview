# AI News Overview — Project Specification

> An AI-powered news aggregation, semantic-search, and summarization platform.
> Working name in code: **`ai-news-review`** / **AI News Overview**.

---

## 1. Executive Summary

AI News Overview is a full-stack web application that crawls Chinese-language news homepages from five major outlets, stores their headline metadata and semantic embeddings, and lets users perform vector-based search and retrieval-augmented summarization (RAG) over the resulting corpus. The system is built as a single, modular monolith with strict layer boundaries so individual subsystems (crawler, vector store, LLM provider, task queue) can be swapped without rewriting consumers.

Anonymous visitors can browse stored headlines and run semantic searches. Authenticated users can trigger ingestion runs and on-demand summaries; superusers can manage accounts through an admin console. Periodic crawling and summarization are handled by a Celery worker pool driven by Celery Beat.

The system targets five sources:

- `https://www.news.cn` (Xinhua)
- `https://www.thepaper.cn/` (The Paper)
- `https://www.people.com.cn/` (People's Daily)
- `https://www.ifeng.com/` (iFeng)
- `https://news.qq.com/tag/aEWqxLtdgmQ=` (QQ News, AI tag)

---

## 2. Design Philosophy

The architecture is opinionated and prioritizes long-term maintainability over short-term feature velocity. Five principles drive every decision.

**Modular monolith over microservices.** The system is deployed as one process per role (web, worker, beat) but organized internally into well-bounded modules. Each module exposes a narrow surface to the rest of the codebase, and cross-module communication happens through interfaces rather than shared mutable state. This keeps deployment simple while preserving the option to extract services later if scale demands it.

**Strict layer separation.** The API layer handles HTTP concerns only — request parsing, response serialization, and authorization checks. Business orchestration lives in services. Persistence lives in repositories. LLMs and crawlers are isolated subsystems exposed through narrow service-layer entry points. The rule `API ≠ Service ≠ Repository ≠ LLM ≠ Crawler` is enforced by file-system organization and reviewed in every change. There is no logic in routes, no SQL in services, and no LLM calls outside the `llm/` module.

**Async-first.** FastAPI, SQLAlchemy 2.x async ORM, and `crawl4ai`'s asynchronous crawler are used end to end. Synchronous boundaries appear only where unavoidable — most notably inside Celery task bodies, which use `asyncio.run` to bridge the synchronous worker process to the async core.

**LLMs as a core compute primitive, not a bolt-on.** Summarization, classification, information extraction, and topic clustering all run through LangChain chains that depend on a pluggable provider abstraction. The choice of provider (DeepSeek, OpenAI, etc.) is a runtime configuration, not a code dependency. The same applies to embeddings: the system can use Chroma's bundled `all-MiniLM-L6-v2` for development or any OpenAI-compatible embedding endpoint in production.

**Design for swappability.** Every external dependency is reachable only through a thin adapter: `vectorstore.factory.get_vector_store()` for the vector DB, `llm.client.get_chat_model()` for chat models, `tasks/*` for the task queue. Replacing Chroma with pgvector, swapping Celery for ARQ, or moving from DeepSeek to a self-hosted model is intentionally a contained change.

---

## 3. Technology Stack

### Backend (Python)

| Concern | Technology | Notes |
|---|---|---|
| Web framework | FastAPI (async) | Lifespan context manager pattern for startup/shutdown |
| Project & dependency management | `uv` + `pyproject.toml` | "src layout" |
| ORM | SQLAlchemy 2.x async | Mapped column / 2.0 typing style |
| Migrations | Alembic | Single revision history under `alembic/versions/` |
| Primary database | PostgreSQL | UUID primary keys for users, short string IDs for articles |
| Configuration | `pydantic-settings` | All config flows through `app.core.config.Settings`; `.env` for local dev |
| Authentication | FastAPI Users | Both JWT bearer and HTTP-only cookie transports, database token strategy |
| Task queue | Celery 5.6 | RabbitMQ broker, Redis result backend; Beat for scheduling |
| Cache & rate limiting | Redis | Same instance can serve as Celery result backend |
| Mail | `fastapi-mail` (SMTP) | Rate-limited verification & password-reset emails |

### AI & Retrieval

| Concern | Technology | Notes |
|---|---|---|
| LLM orchestration | LangChain (core + provider packages) | Prompt templates piped through chat models and `StrOutputParser` |
| LLM providers | DeepSeek (default), OpenAI | Selected via `LLM_PROVIDER` env var |
| Vector database | Chroma (persistent client, cosine HNSW) | Marked as potentially temporary in original brief; isolated behind a `VectorStoreBase` interface |
| Embeddings | Chroma default (`all-MiniLM-L6-v2`) or any OpenAI-compatible endpoint | Configured via `EMBEDDING_*` env vars |

### Crawling

| Concern | Technology | Notes |
|---|---|---|
| Crawler | `crawl4ai` 0.7.x | Headless Playwright-based |
| Anti-bot escalation | 3-tier: normal → playwright-stealth → undetected-chrome | Heavier tiers initialized only on failure |
| Concurrency control | `MemoryAdaptiveDispatcher` + `RateLimiter` | 1–3s base delay, 60s max, 5 concurrent sessions, 85% memory threshold |

### Frontend

| Concern | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite |
| Routing | `react-router` 7 |
| UI components | shadcn/ui (Radix-based) + Tailwind |
| i18n | `react-i18next` (English + 简体中文) |
| Auth flows | JWT bearer(deprecated), HTTP-only cookie session |

---

## 4. System Architecture

### 4.1 Layered View

```
┌──────────────────────────────────────────────┐
│ Frontend (React + Vite)                      │
│   Public pages · Auth flows · Admin console  │
└───────────────────────┬──────────────────────┘
                        │ HTTPS / JSON
┌───────────────────────▼──────────────────────┐
│ FastAPI API Layer (api/v1)                   │
│   auth · users · news · pipeline · admin     │
└───────────────────────┬──────────────────────┘
                        │
┌───────────────────────▼──────────────────────┐
│ Service Layer (business orchestration)       │
│   news_service · rag_service · pipeline_     │
│   rate_limit · auth_service · mail_service   │
└──┬──────────┬──────────┬─────────────┬───────┘
   │          │          │             │
┌──▼──┐  ┌────▼────┐  ┌──▼───┐  ┌──────▼─────┐
│ Re- │  │Crawlers │  │ LLM  │  │ Tasks       │
│ pos │  │(crawl4ai│  │(Lang-│  │ (Celery     │
│     │  │+anti-bot│  │Chain)│  │ + Beat)     │
└──┬──┘  └────┬────┘  └──┬───┘  └──────┬─────┘
   │          │          │             │
┌──▼──────────▼──────────▼─────────────▼──────┐
│ Storage                                       │
│   PostgreSQL · Chroma vector DB · Redis       │
└──────────────────────────────────────────────┘
```

### 4.2 Backend Module Map (src layout)

```
backend/src/app/
├── main.py                  # FastAPI app factory, middleware, router wiring
├── core/                    # Cross-cutting: config, database, logging, security, exceptions, lifespan
├── api/v1/routes/           # HTTP routes only — auth, news, pipeline, admin, system, users
├── schemas/                 # Pydantic request/response models
├── models/                  # SQLAlchemy ORM (User, NewsArticleRecord, AccessToken, …)
├── repositories/            # CRUD + queries (news, user, …)
├── services/                # Business orchestration (news_service, rag_service, …)
├── auth/                    # FastAPI Users wiring: backends, manager, dependencies
├── crawlers/                # Per-site modules + fetcher + parser + anti-bot tiers
├── ingestion/               # Glue between crawled articles and vector store
├── retrieval/               # Filters + retriever for semantic search
├── vectorstore/             # VectorStoreBase + ChromaVectorStore + factory
├── llm/                     # client, prompts/, chains/, embeddings.py
└── tasks/                   # Celery app + crawl_jobs, rag_jobs, mail_jobs
```

### 4.3 Frontend Module Map

```
frontend/src/
├── app/router.tsx           # Routes + route guards (Public, ProtectedAuth, Superuser)
├── pages/                   # Route-level page components
├── features/                # Feature folders: auth, admin, news, profile, system
└── shared/                  # i18n resources, UI primitives, fetch client
```

---

## 5. Features

### 5.1 News Ingestion

A single ingestion run does five things in order: (1) crawl the configured homepages with `crawl4ai`, (2) extract structured `NewsArticle` records via per-site CSS schemas, (3) `INSERT … ON CONFLICT (url) DO UPDATE` them into PostgreSQL via the repositories layer, (4) embed and upsert them into Chroma, and (5) return per-source counts. The same code path powers both the scheduled twice-daily run and the manually triggered ingestion endpoint.

### 5.2 Browsing & Semantic Search

The `/news/homepage` endpoint returns the latest stored articles grouped by source (configurable per-source limit). The `/news/search` endpoint performs cosine-similarity search across the Chroma collection, optionally filtered by source and topic keywords. Topic keywords are concatenated into the embedding query rather than applied as a hard filter, which improves recall when the user's intent is fuzzy. Both endpoints are open to anonymous visitors.

### 5.3 RAG Summarization

The `/news/summarize` endpoint accepts a natural-language query, retrieves the top-N matching articles from Chroma, formats them into a Chinese-language context block, and pipes the result through a LangChain summarization chain. The provider can be overridden per request (DeepSeek or OpenAI). When no relevant articles are found, the endpoint returns a clear "未检索到相关新闻" message rather than a fabricated answer. Summarization requires authentication.

### 5.4 Authentication

Built on FastAPI Users with two coexisting authentication backends:

- **JWT bearer** at `/auth/jwt/login` — for API-style clients and the JWT-mode browser session.
- **HTTP-only cookie** at `/auth/cookie/login` — for cookie-mode browser sessions; cookie name, lifetime, path, domain, secure, httponly, and samesite flags are all configurable.

Both backends share a database-backed access-token strategy, so logout invalidates the token at the database level. The flow includes registration, login, logout, password forgot/reset, email verification, and a verification-resend endpoint. Pending email changes are tracked on the user record and only finalized after the new address is verified.

### 5.5 Admin Console

Superuser-only endpoints under `/admin/`:

- `GET /admin/users` — paginated list with full-text search across `username` and `nickname`, filters for `is_active`, `created_at` range, `updated_at` range. Returns a summary block (total / active / inactive / superusers) alongside the page.
- `PATCH /admin/users/{id}` — toggle `is_active`. Self-disable is rejected with a 400 to prevent locking out the admin console.

The admin API prefix (`/admin/` by default) is configurable so deployments can move it behind a less obvious path.

### 5.6 Pipeline Triggers & Status

Three endpoints under `/pipeline/`:

- `POST /pipeline/retrieve` — enqueues a Celery `run_retrieval_task`. Returns `202 Accepted` with a `task_id`.
- `POST /pipeline/summarize` — enqueues a Celery `run_summarization_task` for a given query.
- `GET /pipeline/status/{task_id}` — polls `AsyncResult` and returns `PENDING` / `STARTED` / `SUCCESS` / `FAILURE` plus the result or error.

Both trigger endpoints are authenticated and rate-limited per user (see §6.4).

### 5.7 Internationalization & Theming

The frontend ships English and Simplified Chinese translations covering navigation, news pages, ingestion UI, auth flows, profile settings, and the admin console. Theme tokens use shadcn/ui's CSS-variable system; component code never references raw colors.

### 5.8 Operational Surfaces

- `GET /healthz` — liveness probe.
- `GET /system/runtime` — non-secret runtime metadata (app name, debug flag, server time, configured admin/auth paths). Used by the frontend home page to render a backend-status panel.

---

## 6. Implementation Details

### 6.1 Crawling Pipeline

Each supported site has its own module under `app/crawlers/` (`xinhua.py`, `thepaper.py`, `people.py`, `ifeng.py`, `qqnews.py`) that exports `SOURCE_KEY`, `URL`, `ALLOWED_DOMAINS`, `MAX_RESULTS`, and a `build_run_configs(bypass_cache: bool)` factory returning a list of `CrawlerRunConfig` objects. The list represents successive extraction-schema attempts: if the first schema fails to produce valid JSON, the next schema is tried before escalating to a heavier browser tier.

The orchestrator (`app/crawlers/fetcher.py`) implements a 3-tier anti-bot escalation:

| Tier | Browser config | When used |
|---|---|---|
| 1 — Normal | Standard headless Chrome, randomized UA, ad/CSS blocking | Always; tries every extraction-schema round per site |
| 2 — Stealth | Playwright-stealth fingerprint masking + navigator override | Only for URLs that failed Tier 1; round 0 only |
| 3 — Undetected | `undetected-chrome` adapter for Cloudflare / TLS-fingerprint bypass | Only for URLs that failed Tier 2 |

Tiers 2 and 3 are initialized lazily — if Tier 1 succeeds for all URLs, the heavier browsers are never spawned. Per-site cookies are loaded once from environment variables (`CRAWLER_COOKIE_XINHUA`, etc.) and injected into every tier's `BrowserConfig` so Playwright routes them to the correct domain automatically.

Concurrency is managed by `MemoryAdaptiveDispatcher`: max 5 concurrent sessions, 1–3 second random base delay between requests per session, 60s max delay, 2 retries, and an 85% memory pressure threshold that pauses dispatch.

After raw extraction, results flow through `parse_articles()` which validates URLs against the site's `ALLOWED_DOMAINS`, normalizes timestamps, generates a stable 16-character article ID, and produces a list of `NewsArticle` dataclasses.

### 6.2 Storage

**PostgreSQL** holds the relational data:

- `user` — UUID-keyed user table (extends `SQLAlchemyBaseUserTableUUID`) with `username` (unique, optional, immutable after registration), `nickname`, `pending_email`, and timestamp columns.
- `accesstoken` — database-backed access tokens for FastAPI Users.
- `news_article` — short-string-keyed articles with `url` (unique), `source` (indexed), `title`, `summary`, `author`, `published_at_raw`, `crawled_at`, plus auto-managed `created_at`/`updated_at`.

Upserts use the PostgreSQL-specific `INSERT … ON CONFLICT (url) DO UPDATE` to make ingestion idempotent: re-crawling an existing URL refreshes its content and `updated_at` without producing duplicates.

**Chroma** holds the vector data, persisted on disk under `CHROMA_PERSIST_DIR`. The collection uses cosine HNSW (`metadata={"hnsw:space": "cosine"}`). The embedding function is selected at collection-creation time: if `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`, and a supported `EMBEDDING_MODEL_NAME` are all set, an `OpenAIEmbeddingFunction` is wired in; otherwise the collection falls back to Chroma's bundled `all-MiniLM-L6-v2`. Switching embedding functions on an existing collection is detected and triggers a recreation with a warning, since mixing embedding spaces produces meaningless distances.

### 6.3 Task Queue & Scheduling

The task queue has been promoted from the original APScheduler / `BackgroundTasks` design to a full Celery deployment. The migration was triggered by the criteria laid out earlier in the design: the need for retry-with-backoff, separate worker processes for CPU-bound LLM calls, and multi-instance coordination.

**Components:**

- `tasks/celery_app.py` — Celery factory, beat schedule, JSON serialization, UTC timezone, late acknowledgment, `worker_prefetch_multiplier=1` (so a slow LLM task doesn't starve a queue).
- `tasks/crawl_jobs.py` — `run_retrieval_task(sources)` runs the full crawl + DB + vector pipeline.
- `tasks/rag_jobs.py` — `run_summarization_task(query)` runs the full RAG summarization pipeline.
- `tasks/mail_jobs.py` — `send_email_task(to, subject, text, html)` for transactional email.

**Beat schedule:**

| Task | Schedule | Retry policy |
|---|---|---|
| `run_retrieval_task` | `crontab(hour="0,12", minute="0")` UTC | 11 retries, 1-hour countdown (covers a full 12-hour scheduling window) |
| `run_summarization_task` | On-demand only | Same retry policy as retrieval |
| `send_email_task` | On-demand only | 3 retries, 60-second countdown |

The boundary between FastAPI and Celery is intentionally kept at the `tasks/` layer. Services don't know they're being called by Celery; they receive a regular `AsyncSession` and run the same code that the test suite drives directly. Each Celery task body opens its own `async_session_maker()` context and bridges with `asyncio.run`.

### 6.4 Pipeline Rate Limiting

Manual pipeline triggers are protected by a Redis-backed rate limiter (`services/pipeline_rate_limit.py`) that enforces two rules per (user, action) pair:

1. `PIPELINE_DAILY_LIMIT` triggers per UTC day (default 2).
2. `PIPELINE_MIN_INTERVAL_SECONDS` minimum gap between consecutive triggers (default 3600).

The two rules apply independently to `retrieve` and `summarize`, so a user spending their daily summarize budget doesn't lose retrieval capacity. The limiter is wired in as a FastAPI dependency, which keeps the rate-limit logic out of the route body and out of the service layer.

### 6.5 Authentication Wiring

`auth/backend.py` constructs both transport options:

```python
cookie_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,         # CookieTransport(...)
    get_strategy=get_database_strategy, # DatabaseStrategy(access_token_db, lifetime_seconds)
)
bearer_backend = AuthenticationBackend(
    name="bearer",
    transport=bearer_transport,         # BearerTransport(tokenUrl="auth/jwt/login")
    get_strategy=get_database_strategy,
)
```

The `FastAPIUsers` instance is constructed with both backends, so the same user pool is reachable through either transport. The frontend exposes the choice at login time: JWT mode stores the bearer token in `localStorage` (or `sessionStorage` if "remember me" is off), cookie mode lets the backend manage the session entirely. Route guards (`PublicOnlyRoute`, `ProtectedAuthRoute`, `SuperuserRoute`) gate pages on the resolved session state.

The cookie configuration is validated at startup: `cookie_samesite="none"` requires `cookie_secure=True`; `cookie_path` must start with `/`; `cookie_secure=True` in debug mode emits a warning because local HTTP testing will silently drop the cookie.

### 6.6 LLM Layer

`llm/client.py` exposes `get_chat_model(provider=None)`. When `provider` is `None`, the value of `LLM_PROVIDER` in settings is used. Each provider has its own block of settings (`DEEPSEEK_*`, `OPENAI_*`) covering API key, base URL, model name, temperature, and max completion tokens. If a key is missing, the client raises `ValueError("DEEPSEEK_API_KEY is not configured.")` rather than silently falling back; the API layer translates this into a `503 Service Unavailable` so the frontend can show a clear message.

Chains live under `llm/chains/`. The summarization chain is a textbook LangChain Expression Language pipeline:

```python
NEWS_SUMMARY_PROMPT | get_chat_model(provider=provider) | StrOutputParser()
```

Prompts are kept in `llm/prompts/` as named templates so they can be versioned, A/B-tested, and reviewed independently of the Python wiring.

### 6.7 Mail

When `MAIL_ENABLED=true`, `services/mail.py` sends transactional emails via SMTP. Provider-specific recipes for Gmail, QQ Mail, 163, and Outlook are documented in `.env.example`. Emails are rate-limited at `EMAIL_RATE_LIMIT_TIMES` per `EMAIL_RATE_LIMIT_SECONDS`. In dev mode with mail disabled, password-reset and verification tokens are written to the backend log so local testing doesn't require a real SMTP server.

### 6.8 Configuration

`app.core.config.Settings` is a single `BaseSettings` subclass that reads from environment variables and `.env`. Notable knobs:

| Group | Variables |
|---|---|
| App | `APP_NAME`, `DEBUG`, `LOG_LEVEL`, `LOG_FORMAT` |
| Database | `POSTGRES_HOST/PORT/USER/PASSWORD/DB` |
| Auth | `AUTH_SECRET`, `TOKEN_LIFETIME_SECONDS`, `COOKIE_*` |
| CORS | `CORS_ORIGINS` (comma-separated, validated to require scheme) |
| Mail | `MAIL_ENABLED`, `SMTP_*`, `EMAIL_RATE_LIMIT_*` |
| Celery / Redis | `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `REDIS_URL` |
| Pipeline limits | `PIPELINE_DAILY_LIMIT`, `PIPELINE_MIN_INTERVAL_SECONDS` |
| Vector store | `CHROMA_PERSIST_DIR`, `CHROMA_COLLECTION_NAME` |
| Embeddings | `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL_NAME` |
| LLM | `LLM_PROVIDER`, `DEEPSEEK_*`, `OPENAI_*` |
| Crawler cookies | `CRAWLER_COOKIE_XINHUA`, `CRAWLER_COOKIE_THEPAPER`, etc. |
| Admin | `ADMIN_API_PREFIX`, `FRONTEND_BASE_URL` |

All access goes through the `lru_cache`-wrapped `get_settings()`. No module reads `os.environ` directly.

### 6.9 Testing

The test suite is structured to mirror the source tree (`tests/api`, `tests/services`, `tests/crawler`). Service tests use `monkeypatch` to swap out external boundaries — the crawler returns canned `NewsArticle` lists, the LLM returns a fixed string — so every test that touches `ingest_homepage_news` or `generate_news_rag_summary` runs in single-digit milliseconds and has no network dependency.

Network-touching tests are marked with `@pytest.mark.network` and are gated behind explicit `-m network` invocation. The crawler integration test (`test_crawl_all_sites_and_save`) exercises the real anti-bot pipeline against all five live sites and writes a JSON snapshot for manual inspection.

API tests use an `httpx.AsyncClient` against the actual FastAPI app and run the full auth flow end-to-end (`/auth/jwt/login`) before exercising protected endpoints.

---

## 7. Operational Concerns

**Process topology.** A typical deployment runs four process groups: a FastAPI ASGI server (e.g., `uvicorn`), one or more Celery workers (`celery -A app.tasks.celery_app worker`), one Celery Beat scheduler (`celery -A app.tasks.celery_app beat`), and the supporting infrastructure (PostgreSQL, RabbitMQ, Redis, optionally a managed Chroma instance).

**Migrations.** All schema changes flow through Alembic. The current head (`4f6f7a8b9c10`) introduces the `news_article` table on top of the FastAPI Users baseline (`c2f9008cfbf1`).

**Observability.** Structured logging is available by setting `LOG_FORMAT=json`. Each Celery task logs a structured success or failure record on completion. Crawler logs include the tier, round index, and per-source counts so anti-bot regressions are easy to diagnose.

**Idempotency.** Re-running ingestion on the same day is safe: PostgreSQL upserts on URL, and Chroma upserts on the article ID. The 12-hour Beat schedule with hourly retries is designed to converge on a fully populated state even if a particular run partially fails.

---

## 8. Roadmap & Migration Criteria

The current architecture is intentionally conservative; several items were considered and explicitly deferred. The triggers below define when each deferred change should be reconsidered.

| Deferred change | Trigger to reconsider |
|---|---|
| pgvector instead of Chroma | When the Chroma collection grows past the dataset where in-process queries are comfortable, or when operational consolidation onto a single Postgres instance becomes valuable |
| Multiple LLM providers selected per task | When summary, classification, and extraction begin to want different cost/quality tradeoffs simultaneously |
| Topic clustering & classification | First-class roadmap item; LLM module already includes prompt slots for it |
| Object storage for raw HTML | When debugging crawler regressions becomes difficult without raw-page archives, or when the LLM pipeline needs to re-process from the original DOM |
| Per-article (not per-homepage) crawling | When users start asking for body summaries rather than headline summaries |
| Real-time crawl scheduling per source | When source-specific cadences diverge significantly from the unified twice-daily schedule |
| Replacing Celery with ARQ | If Celery's operational footprint becomes too heavy for the deployment target; the `tasks/` boundary makes this a contained change |

---

## 9. Glossary

- **Source key.** Short string identifying a news outlet in the codebase (`xinhua`, `thepaper`, `peoples`, `ifeng`, `qqnews`).
- **Tier.** One step in the anti-bot escalation ladder (normal, stealth, undetected).
- **Round.** One extraction-schema attempt within a tier; only Tier 1 runs multiple rounds.
- **Pipeline.** End-to-end retrieval (crawl + DB + vector) or summarization (search + RAG) flow.
- **RAG.** Retrieval-Augmented Generation — the pattern of grounding an LLM answer in a small set of vector-search-retrieved documents.
- **Upsert.** Insert-or-update; here implemented as PostgreSQL `INSERT … ON CONFLICT` and Chroma's collection upsert.
