from __future__ import annotations

from typing import TYPE_CHECKING

from langchain_core.output_parsers import StrOutputParser

from app.llm.client import get_chat_model
from app.llm.prompts.news_summary import NEWS_SUMMARY_PROMPT

if TYPE_CHECKING:
    from langchain_core.language_models import BaseChatModel

    from app.core.config import LlmProvider


def build_news_summary_chain(*, provider: LlmProvider | None = None, model: BaseChatModel | None = None):
    return NEWS_SUMMARY_PROMPT | (model or get_chat_model(provider=provider)) | StrOutputParser()


async def summarize_news_context(
    *,
    query: str,
    context: str,
    provider: LlmProvider | None = None,
    model: BaseChatModel | None = None,
) -> str:
    chain = build_news_summary_chain(provider=provider, model=model)
    return await chain.ainvoke({"query": query, "context": context})
