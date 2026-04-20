import type { HomepageNewsGroup, NewsSourceCode } from "../model";

export const NEWS_SOURCE_ORDER: NewsSourceCode[] = [
  "xinhua",
  "thepaper",
  "peoples",
  "ifeng",
  "qqnews",
];

export const sortHomepageGroups = (groups: HomepageNewsGroup[]) =>
  [...groups].sort(
    (left, right) =>
      NEWS_SOURCE_ORDER.indexOf(left.source) - NEWS_SOURCE_ORDER.indexOf(right.source),
  );
