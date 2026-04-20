from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from app.core.config import get_settings
from app.vectorstore.chroma import ChromaVectorStore

if TYPE_CHECKING:
    from app.vectorstore.base import VectorStoreBase


@lru_cache
def get_vector_store() -> VectorStoreBase:
    settings = get_settings()
    return ChromaVectorStore(persist_dir=settings.chroma_persist_dir)


def build_vector_store(
    *,
    persist_dir: str | None = None,
    collection_name: str | None = None,
) -> VectorStoreBase:
    return ChromaVectorStore(persist_dir=persist_dir, collection_name=collection_name)
