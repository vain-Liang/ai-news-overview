You are working inside an existing repository for an AI news review system.

Project context

* backend: `./backend`
* frontend: `./frontend`

* The goal is to evolve this into a production-style backend that supports:

  * news crawling with Crawl4AI
  * structured storage in PostgreSQL
  * indexing and semantic retrieval with the Chroma vector database
  * LangChain-based RAG workflows for AI-generated news review, summarization, retrieval, and related operations

Build a clean, modular backend scaffold and implement the first working version of:

1. PostgreSQL async database integration
2. Crawl4AI integration scaffolding
3. LangChain integration scaffolding
4. vector store abstraction and initial implementation
5. ingestion pipeline skeleton for indexing crawled content
6. RAG service skeleton and API route

High-level implementation requirements

* Use PostgreSQL as the relational database and Alembic for migrations, async for SQLAlchemy.
* Add clear separation between:

  * API layer
  * auth layer
  * core/config layer
  * ORM models
  * Pydantic schemas
  * repositories/data access
  * business services
  * crawling
  * ingestion/indexing
  * vector store
  * retrieval
  * LangChain integration
  * background tasks

Target directory structure
Please organize the backend into a structure close to this(just reference):

```text
backend/
├── pyproject.toml
├── uv.lock
├── .env.example
├── .env
├── README.md
├── alembic.ini
├── migrations/
├── tests/
│   ├── conftest.py
│   ├── api/
│   ├── auth/
│   └── services/
└── src/
    └── app/
        ├── main.py
        ├── core/
        │   ├── config.py
        │   ├── db.py
        │   ├── logging.py
        │   ├── security.py
        │   └── exceptions.py
        ├── auth/
        │   ├── backend.py
        │   ├── dependencies.py
        │   ├── fastapi_users.py
        │   └── manager.py
        ├── api/
        │   ├── router.py
        │   ├── deps.py
        │   └── v1/
        │       ├── auth.py
        │       ├── users.py
        │       ├── news.py
        │       ├── crawling.py
        │       └── rag.py
        ├── models/
        │   ├── base.py
        │   ├── user.py
        │   ├── news.py
        │   ├── source.py
        │   ├── article_chunk.py
        │   └── crawl_task.py
        ├── schemas/
        │   ├── user.py
        │   ├── auth.py
        │   ├── news.py
        │   ├── crawling.py
        │   └── rag.py
        ├── repositories/
        │   ├── user.py
        │   ├── news.py
        │   ├── source.py
        │   └── article_chunk.py
        ├── services/
        │   ├── auth_service.py
        │   ├── news_service.py
        │   ├── crawl_service.py
        │   ├── ingestion_service.py
        │   └── rag_service.py
        ├── crawlers/
        │   ├── client.py
        │   ├── sources/
        │   ├── pipelines/
        │   └── extractors/
        ├── ingestion/
        │   ├── loader.py
        │   ├── splitter.py
        │   ├── embedder.py
        │   ├── indexer.py
        │   └── pipeline.py
        ├── vectorstore/
        │   ├── base.py
        │   ├── pgvector.py
        │   ├── chroma.py
        │   └── factory.py
        ├── retrieval/
        │   ├── retriever.py
        │   ├── filters.py
        │   └── ranking.py
        ├── llm/
        │   ├── client.py
        │   ├── prompts/
        │   ├── chains/
        │   └── output_parser.py
        ├── tasks/
        │   ├── crawl_jobs.py
        │   ├── ingest_jobs.py
        │   └── rag_jobs.py
        └── utils/
```

Database design expectations
Use PostgreSQL for structured data. At minimum, define models or placeholders for:

* user
* news sources
* news articles
* crawl tasks / crawl jobs
* article chunks or indexed content records

Crawl4AI integration requirements
Use Crawl4AI as the crawling and extraction layer.
Organize it under `src/app/crawlers/`.
Design it so that Crawl4AI is not tightly coupled to FastAPI routes.
Create:

* a crawler client wrapper
* source-specific or rule-based extraction placeholders
* a pipeline layer for cleaning, normalization, deduplication, and transformation into internal data objects

The crawler layer should produce either:

* normalized structured article data, or
* markdown/text content that can be converted into LangChain documents

Do not let the crawler write directly to the vector store. That should happen through the ingestion layer.

LangChain integration requirements
Use LangChain as the orchestration layer for:

* document loading and conversion to LangChain documents
* splitting text into chunks
* embeddings
* retrieval abstraction
* RAG chain composition

Organize LangChain-related logic under:

* `src/app/llm/`
* `src/app/ingestion/`
* `src/app/retrieval/`

Do not bury LangChain usage inside route files.
Keep route files thin and business logic in services.

Vector database requirements
Use a vector store abstraction. Make it possible to switch implementations.
Provide:

* an abstract interface
* a PostgreSQL/pgvector-oriented implementation if feasible
* a local-development implementation such as Chroma if that makes setup easier
* a factory for selecting the backend from settings

The design should support:

* adding chunks with embeddings and metadata
* similarity search
* filtering by metadata
* later extension to reranking

RAG and ingestion suggestions
Implement the architecture as separate phases:

1. Crawling
2. Structuring / normalization
3. Relational persistence in PostgreSQL
4. Conversion into LangChain documents
5. Splitting
6. Embedding
7. Vector indexing
8. Retrieval
9. Generation with LLM

Prefer a structure where:

* route modules define endpoints
* services perform business orchestration
* repositories handle database access

Important constraints

* Do not mix crawling, indexing, and retrieval logic into one module.
* Design the project so that the first version is runnable even if some advanced RAG components are still placeholders.
* Use environment-driven configuration and avoid hardcoding secrets.

Notes and points to watch

* The vector store should remain decoupled from Crawl4AI.
* PostgreSQL stores structured records; the vector store handles semantic retrieval.
* Link article records and chunk metadata cleanly so RAG can trace answers back to source articles.
* the project is set up for the next implementation phase rather than being a loose collection of files
