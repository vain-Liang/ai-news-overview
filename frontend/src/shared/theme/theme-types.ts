import type { ThemePreference } from "./theme-utils";

export type ThemeContextValue = {
  appliedTheme: "light" | "dark";
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
};
