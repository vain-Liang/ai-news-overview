from __future__ import annotations


def build_source_filter(source: str | None) -> dict | None:
    if not source:
        return None
    return {"source": source}
