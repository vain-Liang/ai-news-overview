import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveAppliedTheme,
  resolveStoredThemePreference,
} from "../src/shared/theme/theme-utils.ts";

test("resolveStoredThemePreference accepts valid values", () => {
  assert.equal(resolveStoredThemePreference("light"), "light");
  assert.equal(resolveStoredThemePreference("dark"), "dark");
  assert.equal(resolveStoredThemePreference("system"), "system");
  assert.equal(resolveStoredThemePreference("unexpected"), "system");
});

test("resolveAppliedTheme maps system preference to actual theme", () => {
  assert.equal(resolveAppliedTheme("system", true), "dark");
  assert.equal(resolveAppliedTheme("system", false), "light");
  assert.equal(resolveAppliedTheme("light", true), "light");
  assert.equal(resolveAppliedTheme("dark", false), "dark");
});
