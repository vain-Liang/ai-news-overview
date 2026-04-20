from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.config import get_settings
from app.llm.providers.deepseek import get_deepseek_chat_model
from app.llm.providers.openai import get_openai_chat_model

if TYPE_CHECKING:
    from langchain_core.language_models import BaseChatModel

    from app.core.config import LlmProvider


def get_chat_model(*, provider: LlmProvider | None = None) -> BaseChatModel:
    selected_provider = provider or get_settings().llm_provider
    if selected_provider == "deepseek":
        return get_deepseek_chat_model()
    if selected_provider == "openai":
        return get_openai_chat_model()
    raise ValueError(f"Unsupported LLM provider: {selected_provider}")
