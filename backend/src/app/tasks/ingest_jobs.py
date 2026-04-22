from __future__ import annotations

# The ingestion pipeline (crawl → DB → vector store) is bundled in the
# retrieval service. Re-export the retrieval task so callers that expect
# a dedicated ingest entry point still work.
from app.tasks.crawl_jobs import run_retrieval_task as run_ingest_task

__all__ = ["run_ingest_task"]
