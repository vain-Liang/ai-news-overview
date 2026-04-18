import assert from "node:assert/strict";
import test from "node:test";

import { resolveInitialLanguage } from "../src/shared/i18n/config.ts";

test("resolveInitialLanguage prefers stored preferences", () => {
  assert.equal(resolveInitialLanguage("zh-CN", "en-US"), "zh-CN");
  assert.equal(resolveInitialLanguage("en", "zh-CN"), "en");
});

test("resolveInitialLanguage falls back to navigator locale", () => {
  assert.equal(resolveInitialLanguage(null, "zh-CN"), "zh-CN");
  assert.equal(resolveInitialLanguage(null, "en-US"), "en");
  assert.equal(resolveInitialLanguage(null, undefined), "en");
});
