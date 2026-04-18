import assert from "node:assert/strict";
import test from "node:test";

import {
  clearAuthToken,
  readAuthState,
  writeAuthToken,
} from "../src/features/auth/lib/auth-storage.ts";

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

test("readAuthState returns an empty default without stored auth", () => {
  installWindow();

  assert.deepEqual(readAuthState(), {
    token: "",
    persistence: "local",
  });
});

test("writeAuthToken stores remembered sessions in localStorage", () => {
  const { localStorage, sessionStorage } = installWindow();

  writeAuthToken("remembered-token", "local");

  assert.equal(localStorage.getItem("ai-news-review.auth-token"), "remembered-token");
  assert.equal(sessionStorage.getItem("ai-news-review.auth-token"), null);
  assert.deepEqual(readAuthState(), {
    token: "remembered-token",
    persistence: "local",
  });
});

test("writeAuthToken stores temporary sessions in sessionStorage", () => {
  const { localStorage, sessionStorage } = installWindow();

  writeAuthToken("session-token", "session");

  assert.equal(localStorage.getItem("ai-news-review.auth-token"), null);
  assert.equal(sessionStorage.getItem("ai-news-review.auth-token"), "session-token");
  assert.deepEqual(readAuthState(), {
    token: "session-token",
    persistence: "session",
  });
});

test("clearAuthToken removes tokens from both browser stores", () => {
  const { localStorage, sessionStorage } = installWindow();

  writeAuthToken("remembered-token", "local");
  writeAuthToken("session-token", "session");
  clearAuthToken();

  assert.equal(localStorage.getItem("ai-news-review.auth-token"), null);
  assert.equal(sessionStorage.getItem("ai-news-review.auth-token"), null);
});
