from __future__ import annotations

from app.core.config import get_settings
from app.vectorstore.chroma import _build_embedding_function


def test_text_embedding_3_small_builds_openai_embedding_function(monkeypatch) -> None:
    monkeypatch.setenv("EMBEDDING_API_KEY", "sk-test")
    monkeypatch.setenv("EMBEDDING_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
    get_settings.cache_clear()

    try:
        embedding_function = _build_embedding_function()
    finally:
        get_settings.cache_clear()

    assert embedding_function is not None
    assert embedding_function.model_name == "text-embedding-3-small"
