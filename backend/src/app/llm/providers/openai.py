from __future__ import annotations

from typing import TYPE_CHECKING

from langchain.chat_models import init_chat_model

from app.core.config import get_settings

if TYPE_CHECKING:
    from langchain_core.language_models import BaseChatModel


def get_openai_chat_model() -> BaseChatModel:
    settings = get_settings()
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured.")

    return init_chat_model(
        model=settings.openai_model,
        model_provider="openai",
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        temperature=settings.openai_temperature,
        max_completion_tokens=settings.openai_max_completion_tokens,
    )
