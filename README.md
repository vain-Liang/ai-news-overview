// TODO: complete README


# Introduction
A news review system based AI(LLMs). Backend is built with LangChain, FastAPI, and frontend is built with React.

- `ai-news-review` is an AI-powered news summary system. 

- The frontend uses the [React framework](https://react.dev).

> [!CAUTION]
> This is still uncertain, as it is unclear whether crawl4ai can correctly retrieve news content.
- While the backend plans to use [crawl4ai](https://github.com/unclecode/crawl4ai) to crawl news content.

- It uses the [LangChain framework](https://github.com/langchain-ai/langchain) to integrate and invoke `large language models` (LLMs) to structure the crawled content.

- It **plans to** use a vector database to store the structured data and the `PostgreSQL` database to store user and news metadata, among other data.

- It will use large language models (LLMs) to generate summaries of the news data, creating news overviews.

- It uses the FastAPI web framework to encapsulate and manage the API interfaces (User Authentication, System Management, etc.).


## Project structure
> [!WARNING]
> This is a sample structure, it is not the final result and can be freely modified at any time.
```text
backend/
├─ pyproject.toml
├─ .env
├─ alembic.ini
└─ src/
   └─ app/
      ├─ __init__.py
      ├─ main.py
      ├─ core/
      │  ├─ __init__.py
      │  ├─ config.py
      │  ├─ logging.py
      │  ├─ security.py
      │  ├─ database.py
      │  ├─ redis.py
      │  ├─ exceptions.py
      │  └─ lifespan.py
      ├─ api/
      │  ├─ __init__.py
      │  ├─ deps.py
      │  ├─ router.py
      │  └─ v1/
      │     ├─ __init__.py
      │     ├─ auth.py
      │     ├─ users.py
      │     ├─ news.py
      │     ├─ sources.py
      │     ├─ crawl_tasks.py
      │     ├─ summaries.py
      │     └─ topics.py
      ├─ schemas/              # Request-Response Pydantic Model
      │  ├─ __init__.py
      │  ├─ auth.py
      │  ├─ user.py
      │  ├─ news.py
      │  ├─ source.py
      │  ├─ summary.py
      │  └─ common.py
      ├─ models/               # Database entity
      │  ├─ __init__.py
      │  ├─ user.py
      │  ├─ role.py
      │  ├─ news.py
      │  ├─ source.py
      │  ├─ crawl_task.py
      │  └─ summary.py
      ├─ repositories/         # Data access, CRUD...
      │  ├─ __init__.py
      │  ├─ user.py
      │  ├─ news.py
      │  ├─ source.py
      │  └─ summary.py
      ├─ services/
      │  ├─ __init__.py
      │  ├─ auth_service.py
      │  ├─ user_service.py
      │  ├─ news_service.py
      │  ├─ crawl_service.py
      │  ├─ llm_service.py
      │  ├─ summary_service.py
      │  └─ topic_service.py
      ├─ crawlers/
      │  ├─ __init__.py
      │  ├─ base.py
      │  ├─ crawl4ai_client.py
      │  ├─ parsers/
      │  │  ├─ __init__.py
      │  │  ├─ generic.py
      │  │  └─ site_rules.py
      │  └─ pipelines/
      │     ├─ __init__.py
      │     ├─ cleaner.py
      │     ├─ deduplicator.py
      │     └─ normalizer.py
      ├─ llm/                # Model capability
      │  ├─ __init__.py
      │  ├─ client.py
      │  ├─ prompts/
      │  │  ├─ summary.py
      │  │  ├─ classify.py
      │  │  └─ extract.py
      │  ├─ chains/
      │  │  ├─ __init__.py
      │  │  ├─ summary_chain.py
      │  │  └─ topic_chain.py
      │  └─ embeddings.py
      ├─ tasks/            # Keep on hand. Advanced features, background tasks, scheduling
      │  ├─ __init__.py
      │  ├─ scheduler.py
      │  ├─ crawl_jobs.py
      │  └─ summary_jobs.py
      ├─ db/
      │  ├─ __init__.py
      │  ├─ base.py
      │  ├─ session.py
      │  └─ init_db.py
      ├─ utils/
      └─ constants/

frontend/
├─ README.md
├─ README-CN.md
```



# Development
- Use [`Conventional Commits Specification`](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.
  - There are [a few tools](https://www.conventionalcommits.org/en/about/#tooling-for-conventional-commits) can refer to:
    - [commitizen/cz-cli](https://github.com/commitizen/cz-cli)
    - [commitlint](https://commitlint.js.org/guides/getting-started.html)
    - [commitizen-tools/commitizen](https://commitizen-tools.github.io/commitizen/)
    - and so on
> [!NOTE]
> This project use [![Static Badge](https://img.shields.io/badge/commitizen--tools-commitizen-brightgreen%3Flogo%3Dgithub)](https://commitizen-tools.github.io/commitizen/) to commit (use `uv tool install commitizen` to install easily).
> You can use other conventional commits tools.