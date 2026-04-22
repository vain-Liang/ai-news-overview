from __future__ import annotations

from typing import TYPE_CHECKING

from langchain_core.output_parsers import StrOutputParser

from app.llm.client import get_chat_model
from app.llm.prompts.article_summary import ARTICLE_SUMMARY_PROMPT

if TYPE_CHECKING:
    from app.core.config import LlmProvider


async def summarize_article(*, title: str, raw_summary: str, provider: LlmProvider | None = None) -> str:
    chain = ARTICLE_SUMMARY_PROMPT | get_chat_model(provider=provider) | StrOutputParser()
    return await chain.ainvoke({"title": title, "raw_summary": raw_summary})
