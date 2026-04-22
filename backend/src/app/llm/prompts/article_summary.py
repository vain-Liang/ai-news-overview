from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

ARTICLE_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "你是一名专业的中文新闻编辑。根据提供的新闻标题和原始摘要（可能为空），"
            "生成一段简洁、准确的中文新闻摘要（1-2句话）。"
            "只使用已提供的信息，不要编造任何细节。"
            "若信息不足，仅用一句话概述标题含义即可。",
        ),
        (
            "human",
            "标题：{title}\n\n原始摘要：{raw_summary}",
        ),
    ]
)
