from __future__ import annotations

from unittest.mock import MagicMock

from app.retrieval.retriever import _build_query, semantic_search
from app.vectorstore.base import SearchResult


class TestBuildQuery:
    def test_returns_query_unchanged_when_no_topics(self) -> None:
        assert _build_query("AI 新闻", None) == "AI 新闻"

    def test_returns_query_unchanged_when_topics_empty(self) -> None:
        assert _build_query("AI 新闻", []) == "AI 新闻"

    def test_appends_topics_to_query(self) -> None:
        result = _build_query("latest news", ["science", "economy"])
        assert result == "latest news science economy"

    def test_single_topic_appended(self) -> None:
        result = _build_query("中国", ["经济"])
        assert result == "中国 经济"


class TestSemanticSearch:
    def _make_result(self, article_id: str, distance: float = 0.1) -> SearchResult:
        return SearchResult(
            id=article_id,
            document="title\nsummary",
            metadata={"source": "xinhua", "title": "title"},
            distance=distance,
        )

    def test_calls_store_with_plain_query_when_no_topics(self) -> None:
        store = MagicMock()
        store.search_articles.return_value = [self._make_result("news-1")]

        results = semantic_search("经济增长", store, n_results=5)

        store.search_articles.assert_called_once_with(
            query="经济增长", n_results=5, source=None, topics=None
        )
        assert len(results) == 1

    def test_enriches_query_with_topics(self) -> None:
        store = MagicMock()
        store.search_articles.return_value = []

        semantic_search("news", store, topics=["science", "tech"])

        call_kwargs = store.search_articles.call_args.kwargs
        assert call_kwargs["query"] == "news science tech"
        assert call_kwargs["topics"] == ["science", "tech"]

    def test_passes_source_filter_through(self) -> None:
        store = MagicMock()
        store.search_articles.return_value = []

        semantic_search("query", store, source="xinhua")

        call_kwargs = store.search_articles.call_args.kwargs
        assert call_kwargs["source"] == "xinhua"

    def test_returns_store_results_unchanged(self) -> None:
        store = MagicMock()
        expected = [self._make_result("a"), self._make_result("b", 0.3)]
        store.search_articles.return_value = expected

        results = semantic_search("q", store)

        assert results is expected
