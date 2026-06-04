from __future__ import annotations

from app.llm.prompts.news_summary import NEWS_SUMMARY_PROMPT


def test_news_summary_prompt_requires_inline_citations_without_trend_or_reference_sections() -> None:
    formatted = NEWS_SUMMARY_PROMPT.format(query="请总结今日 AI 新闻", context="[新闻 1]\n标题：示例")

    assert "如果多篇新闻存在共同趋势，请单独指出“趋势观察”" not in formatted
    assert "最后追加“参考新闻”列表，列出每条新闻的标题、来源和 URL" not in formatted
    assert "再用 3-6 条要点总结关键信息" not in formatted
    assert "只输出 1 段自然语言新闻概览" in formatted
    assert "不要再拆分、复述或总结“关键信息”“要点”“重点”" in formatted
    assert "格式统一为 [1]、[2]" in formatted
    assert "不要输出列表、编号要点、小标题、趋势判断、趋势观察、参考新闻、参考资料或来源列表" in formatted
    assert "不要在正文末尾追加标题、来源、URL 清单、尾注或额外说明" in formatted
    assert "只输出一句信息不足提示，不要添加引用编号" in formatted
