from __future__ import annotations

from app.retrieval.filters import build_search_filter, build_source_filter, build_topic_filter


class TestBuildSourceFilter:
    def test_returns_none_when_source_is_none(self) -> None:
        assert build_source_filter(None) is None

    def test_returns_none_when_source_is_empty_string(self) -> None:
        assert build_source_filter("") is None

    def test_returns_source_filter(self) -> None:
        result = build_source_filter("xinhua")
        assert result == {"source": "xinhua"}


class TestBuildTopicFilter:
    def test_returns_none_when_topics_is_none(self) -> None:
        assert build_topic_filter(None) is None

    def test_returns_none_when_topics_is_empty_list(self) -> None:
        assert build_topic_filter([]) is None

    def test_single_topic_produces_or_with_one_clause(self) -> None:
        result = build_topic_filter(["science"])
        assert result == {"$or": [{"tags": {"$contains": "|science|"}}]}

    def test_multiple_topics_produces_or_with_multiple_clauses(self) -> None:
        result = build_topic_filter(["science", "economy"])
        assert result == {
            "$or": [
                {"tags": {"$contains": "|science|"}},
                {"tags": {"$contains": "|economy|"}},
            ]
        }

    def test_topic_pattern_uses_pipe_delimiters(self) -> None:
        result = build_topic_filter(["ai"])
        assert result is not None
        clause = result["$or"][0]
        assert clause["tags"]["$contains"] == "|ai|"


class TestBuildSearchFilter:
    def test_returns_none_when_both_are_none(self) -> None:
        assert build_search_filter(None, None) is None

    def test_returns_source_filter_when_only_source_given(self) -> None:
        result = build_search_filter("xinhua", None)
        assert result == {"source": "xinhua"}

    def test_returns_topic_filter_when_only_topics_given(self) -> None:
        result = build_search_filter(None, ["science"])
        assert result == {"$or": [{"tags": {"$contains": "|science|"}}]}

    def test_combines_source_and_topics_with_and(self) -> None:
        result = build_search_filter("xinhua", ["economy"])
        assert result == {
            "$and": [
                {"source": "xinhua"},
                {"$or": [{"tags": {"$contains": "|economy|"}}]},
            ]
        }

    def test_returns_none_when_source_empty_and_no_topics(self) -> None:
        assert build_search_filter("", []) is None
