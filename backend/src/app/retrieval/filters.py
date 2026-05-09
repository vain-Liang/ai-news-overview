from __future__ import annotations


def build_source_filter(source: str | None) -> dict | None:
    if not source:
        return None
    return {"source": source}


def build_topic_filter(topics: list[str] | None) -> dict | None:
    if not topics:
        return None
    return {"$or": [{"tags": {"$contains": f"|{t}|"}} for t in topics]}


def build_search_filter(source: str | None, topics: list[str] | None) -> dict | None:
    source_filter = build_source_filter(source)
    topic_filter = build_topic_filter(topics)
    if source_filter and topic_filter:
        return {"$and": [source_filter, topic_filter]}
    return source_filter or topic_filter
