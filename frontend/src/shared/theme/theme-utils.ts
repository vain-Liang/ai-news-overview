export type ThemePreference = "system" | "light" | "dark";

export const themeStorageKey = "ai-news-review.theme";

export const isThemePreference = (value: string | null): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

export const resolveStoredThemePreference = (
  storedTheme: string | null,
): ThemePreference => (isThemePreference(storedTheme) ? storedTheme : "system");

export const resolveAppliedTheme = (
  preference: ThemePreference,
  prefersDark: boolean,
) => (preference === "system" ? (prefersDark ? "dark" : "light") : preference);
