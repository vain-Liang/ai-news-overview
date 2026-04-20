from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SearchResult:
    id: str
    document: str
    metadata: dict
    distance: float


class VectorStoreBase(ABC):
    @abstractmethod
    def store_articles(self, articles: list[dict]) -> None: ...

    @abstractmethod
    def search_articles(
        self, query: str, n_results: int = 10, source: str | None = None
    ) -> list[SearchResult]: ...
