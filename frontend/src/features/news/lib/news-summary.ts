import type { NewsSearchResult } from "../model";

const REFERENCE_PATTERN = /\[(\d+)\]/g;
const ORDERED_LIST_PATTERN = /^\d+\.\s+/;
const BULLET_LIST_PATTERN = /^[-•]\s+/;
const INSUFFICIENT_SUMMARY_PATTERNS = [
  /信息不足/,
  /不足以/,
  /没有足够/,
  /未检索到/,
  /无法(?:生成|形成|回答|判断)/,
  /insufficient/i,
  /not enough/i,
  /unable to/i,
  /cannot/i,
  /no relevant/i,
];

export type SummaryTextPart =
  | { kind: "text"; value: string }
  | { kind: "reference"; index: number };

export type SummaryBlock =
  | { kind: "paragraph"; parts: SummaryTextPart[] }
  | { kind: "list"; items: SummaryTextPart[][] };

export const isInsufficientSummary = (summary: string): boolean =>
  INSUFFICIENT_SUMMARY_PATTERNS.some((pattern) => pattern.test(summary));

export const extractReferenceIndices = (summary: string, maxResults: number): number[] => {
  const indices: number[] = [];
  const seen = new Set<number>();

  for (const match of summary.matchAll(REFERENCE_PATTERN)) {
    const index = Number(match[1]);
    if (!Number.isInteger(index) || index < 1 || index > maxResults || seen.has(index)) {
      continue;
    }
    seen.add(index);
    indices.push(index);
  }

  return indices;
};

const parseParts = (value: string): SummaryTextPart[] => {
  const parts: SummaryTextPart[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(REFERENCE_PATTERN)) {
    const fullMatch = match[0];
    const rawIndex = match[1];
    const matchIndex = match.index ?? -1;

    if (matchIndex < 0) {
      continue;
    }

    if (matchIndex > lastIndex) {
      parts.push({ kind: "text", value: value.slice(lastIndex, matchIndex) });
    }

    parts.push({ kind: "reference", index: Number(rawIndex) });
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < value.length) {
    parts.push({ kind: "text", value: value.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ kind: "text", value }];
};

const stripListMarker = (line: string): string => {
  if (ORDERED_LIST_PATTERN.test(line)) {
    return line.replace(ORDERED_LIST_PATTERN, "").trim();
  }
  if (BULLET_LIST_PATTERN.test(line)) {
    return line.replace(BULLET_LIST_PATTERN, "").trim();
  }
  return line.trim();
};

const isListLine = (line: string): boolean => ORDERED_LIST_PATTERN.test(line) || BULLET_LIST_PATTERN.test(line);

export const parseSummaryBlocks = (summary: string): SummaryBlock[] =>
  summary
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      if (lines.every(isListLine)) {
        return {
          kind: "list" as const,
          items: lines.map((line) => parseParts(stripListMarker(line))),
        };
      }

      return {
        kind: "paragraph" as const,
        parts: parseParts(lines.join(" ")),
      };
    });

export const selectCitedArticles = (summary: string, results: NewsSearchResult[]): NewsSearchResult[] => {
  if (isInsufficientSummary(summary)) {
    return [];
  }

  const indices = extractReferenceIndices(summary, results.length);
  if (indices.length === 0) {
    return results;
  }

  return indices
    .map((index) => results[index - 1])
    .filter((article): article is NewsSearchResult => Boolean(article));
};
