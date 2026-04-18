import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { ThemeContext } from "./theme-context";
import type { ThemeContextValue } from "./theme-types";
import {
  resolveAppliedTheme,
  resolveStoredThemePreference,
  themeStorageKey,
  type ThemePreference,
} from "./theme-utils";

const getSystemPreference = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    typeof window === "undefined"
      ? "system"
      : resolveStoredThemePreference(window.localStorage.getItem(themeStorageKey)),
  );
  const [prefersDark, setPrefersDark] = useState(getSystemPreference);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const appliedTheme = useMemo(
    () => resolveAppliedTheme(themePreference, prefersDark),
    [prefersDark, themePreference],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", appliedTheme === "dark");
    root.style.colorScheme = appliedTheme;
  }, [appliedTheme]);

  const setThemePreference = useCallback((value: ThemePreference) => {
    setThemePreferenceState(value);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(themeStorageKey, value);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ appliedTheme, themePreference, setThemePreference }),
    [appliedTheme, setThemePreference, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
