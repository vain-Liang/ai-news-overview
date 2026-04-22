const storageKey = "ai-news-review.auth-token";

const canUseStorage = () => typeof window !== "undefined";

export const clearAuthToken = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
};
