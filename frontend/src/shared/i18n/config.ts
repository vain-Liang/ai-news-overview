import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./resources.ts";

export type AppLanguage = "en" | "zh-CN";

const languageStorageKey = "ai-news-review.language";

const isSupportedLanguage = (value: string | null): value is AppLanguage =>
  value === "en" || value === "zh-CN";

export const resolveInitialLanguage = (
  storedLanguage: string | null,
  navigatorLanguage?: string,
): AppLanguage => {
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  if (navigatorLanguage?.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  return "en";
};

const initialLanguage = resolveInitialLanguage(
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem(languageStorageKey),
  typeof navigator === "undefined" ? undefined : navigator.language,
);

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: "en",
  resources,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(languageStorageKey, language);
});

export { languageStorageKey };
export default i18n;
