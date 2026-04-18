import type { AuthPersistence, StoredAuthState } from "../model";

const storageKey = "ai-news-review.auth-token";

const canUseStorage = () => typeof window !== "undefined";

const getStorage = (persistence: AuthPersistence) =>
  persistence === "local" ? window.localStorage : window.sessionStorage;

export const readAuthState = (): StoredAuthState => {
  if (!canUseStorage()) {
    return { token: "", persistence: "local" };
  }

  const localToken = window.localStorage.getItem(storageKey);
  if (localToken) {
    return { token: localToken, persistence: "local" };
  }

  const sessionToken = window.sessionStorage.getItem(storageKey);
  if (sessionToken) {
    return { token: sessionToken, persistence: "session" };
  }

  return { token: "", persistence: "local" };
};

export const writeAuthToken = (
  token: string,
  persistence: AuthPersistence,
) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
  getStorage(persistence).setItem(storageKey, token);
};

export const clearAuthToken = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
};
