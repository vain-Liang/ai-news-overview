import assert from "node:assert/strict";
import test from "node:test";

import { resolveInitialLanguage } from "../src/shared/i18n/config.ts";
import { resources } from "../src/shared/i18n/registry.ts";

test("resolveInitialLanguage prefers stored preferences", () => {
  assert.equal(resolveInitialLanguage("zh-CN", "en-US"), "zh-CN");
  assert.equal(resolveInitialLanguage("en", "zh-CN"), "en");
});

test("resolveInitialLanguage falls back to navigator locale", () => {
  assert.equal(resolveInitialLanguage(null, "zh-CN"), "zh-CN");
  assert.equal(resolveInitialLanguage(null, "en-US"), "en");
  assert.equal(resolveInitialLanguage(null, undefined), "en");
});

test("registry exposes matching namespaces for both supported languages", () => {
  const englishNamespaces = Object.keys(resources.en).sort();
  const chineseNamespaces = Object.keys(resources["zh-CN"]).sort();

  assert.deepEqual(chineseNamespaces, englishNamespaces);
  assert.ok(englishNamespaces.includes("appShell"));
  assert.ok(englishNamespaces.includes("loginForm"));
  assert.ok(englishNamespaces.includes("runtimeStatusCard"));
});
