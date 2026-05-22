import { MoonStar, SunMedium } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "../theme/theme-context";
import { Button } from "./button";

export const ThemeToggle = () => {
  const { t } = useTranslation("themeToggle");
  const { appliedTheme, setThemePreference } = useTheme();
  const isDark = appliedTheme === "dark";
  const Icon = isDark ? MoonStar : SunMedium;

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="rounded-full border border-border/60 bg-background/80 px-3"
      onClick={() => setThemePreference(isDark ? "light" : "dark")}
      aria-label={t(isDark ? "light" : "dark")}
    >
      <Icon className="size-4" />
      <span>{t(isDark ? "dark" : "light")}</span>
    </Button>
  );
};
