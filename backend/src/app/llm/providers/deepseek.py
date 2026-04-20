from __future__ import annotations

from typing import TYPE_CHECKING

from langchain_deepseek import ChatDeepSeek
from pydantic import SecretStr

from app.core.config import get_settings

if TYPE_CHECKING:
    from langchain_core.language_models import BaseChatModel


def get_deepseek_chat_model() -> BaseChatModel:
    settings = get_settings()
    if not settings.deepseek_api_key:
        raise ValueError("DEEPSEEK_API_KEY is not configured.")

    return ChatDeepSeek(
        model=settings.deepseek_model,
        api_key=SecretStr(settings.deepseek_api_key),
        api_base=settings.deepseek_base_url,
        temperature=settings.deepseek_temperature,
        max_tokens=settings.deepseek_max_completion_tokens,
        max_retries=2,
    )
