import assert from "node:assert/strict";
import test from "node:test";

import { clearAuthToken } from "../src/features/auth/lib/auth-storage.ts";

class MemoryStorage {
  #store = new Map<string, string>();

  getItem(key: string) {
    return this.#store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#store.set(key, String(value));
  }

  removeItem(key: string) {
    this.#store.delete(key);
  }
}

const installWindow = () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();

  Object.defineProperty(globalThis, "window", {
    value: { localStorage, sessionStorage },
    configurable: true,
  });

  return { localStorage, sessionStorage };
};

test("clearAuthToken removes tokens from both browser stores", () => {
  const { localStorage, sessionStorage } = installWindow();

  localStorage.setItem("ai-news-review.auth-token", "remembered-token");
  sessionStorage.setItem("ai-news-review.auth-token", "session-token");
  clearAuthToken();

  assert.equal(localStorage.getItem("ai-news-review.auth-token"), null);
  assert.equal(sessionStorage.getItem("ai-news-review.auth-token"), null);
});
