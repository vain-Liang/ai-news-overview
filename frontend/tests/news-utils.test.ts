import assert from "node:assert/strict";
import test from "node:test";

import { sortHomepageGroups } from "../src/features/news/lib/news-utils.ts";
import type { HomepageNewsGroup } from "../src/features/news/model.ts";

test("sortHomepageGroups follows the configured source order", () => {
  const groups: HomepageNewsGroup[] = [
    { source: "ifeng", articles: [] },
    { source: "xinhua", articles: [] },
    { source: "qqnews", articles: [] },
  ];

  const sorted = sortHomepageGroups(groups);

  assert.deepEqual(
    sorted.map((group) => group.source),
    ["xinhua", "ifeng", "qqnews"],
  );
});
