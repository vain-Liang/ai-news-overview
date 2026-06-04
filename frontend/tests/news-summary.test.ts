import assert from "node:assert/strict";
import test from "node:test";

import {
  extractReferenceIndices,
  isInsufficientSummary,
  parseSummaryBlocks,
  selectCitedArticles,
} from "../src/features/news/lib/news-summary.ts";
import type { NewsSearchResult } from "../src/features/news/model.ts";

const results: NewsSearchResult[] = [
  {
    id: "1",
    url: "https://example.com/1",
    source: "xinhua",
    title: "标题 1",
    summary: "",
    author: "",
    published_at: "2026-05-01",
    crawled_at: null,
    distance: 0.1,
  },
  {
    id: "2",
    url: "https://example.com/2",
    source: "ifeng",
    title: "标题 2",
    summary: "",
    author: "",
    published_at: "2026-05-02",
    crawled_at: null,
    distance: 0.2,
  },
  {
    id: "3",
    url: "https://example.com/3",
    source: "qqnews",
    title: "标题 3",
    summary: "",
    author: "",
    published_at: "2026-05-03",
    crawled_at: null,
    distance: 0.3,
  },
];

test("extractReferenceIndices keeps first-seen valid references only", () => {
  assert.deepEqual(extractReferenceIndices("概览[2] 细节[1][2][9]", 3), [2, 1]);
});

test("parseSummaryBlocks keeps paragraphs and list items with inline references", () => {
  const blocks = parseSummaryBlocks("总体概览[1]\n\n- 要点一[2]\n- 要点二\n\n补充段落");

  assert.equal(blocks.length, 3);
  assert.equal(blocks[0]?.kind, "paragraph");
  assert.equal(blocks[1]?.kind, "list");
  assert.equal(blocks[2]?.kind, "paragraph");

  if (blocks[1]?.kind !== "list") {
    throw new Error("expected list block");
  }

  assert.equal(blocks[1].items.length, 2);
  assert.deepEqual(blocks[1].items[0], [
    { kind: "text", value: "要点一" },
    { kind: "reference", index: 2 },
  ]);
});

test("selectCitedArticles deduplicates and orders cited results", () => {
  const selected = selectCitedArticles("总览[2] 细节[1][2]", results);

  assert.deepEqual(
    selected.map((article) => article.id),
    ["2", "1"],
  );
});

test("selectCitedArticles falls back to all results when no valid citations exist", () => {
  assert.deepEqual(selectCitedArticles("没有引用 [7]", results), results);
});

test("isInsufficientSummary detects low-information model output", () => {
  assert.equal(isInsufficientSummary("检索到的标题不足以形成相关概览。[1]"), true);
  assert.equal(isInsufficientSummary("Related titles cover product launches and policy responses.[1]"), false);
});

test("selectCitedArticles hides sources when summary says information is insufficient", () => {
  assert.deepEqual(selectCitedArticles("信息不足，无法形成与主题相关的新闻概览。[1]", results), []);
});
