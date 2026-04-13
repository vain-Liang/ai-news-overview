---
// TODO: complete README
---

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
|
├─ src/
│  └─ app/
│     ├─ main.py
|     ├─ .env
|     ├─ alembic/
│     ├─ core/
│     │  ├─ config.py
│     │  └─ db.py
│     ├─ models/
│     │  ├─ base.py
│     │  └─ user.py
│     ├─ schemas/
│     │  └─ user.py
│     ├─ auth/
│     │  ├─ backend.py
│     │  ├─ manager.py
│     │  └─ dependencies.py
│     └─ api/
│        ├─ router.py
│        └─ me.py
frontend/
├─ README.md
├─ README-CN.md
```