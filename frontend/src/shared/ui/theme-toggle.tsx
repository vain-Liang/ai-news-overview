import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "../theme/theme-context";
import type { ThemePreference } from "../theme/theme-utils";
import { Button } from "./button";

const preferences: Array<{ key: ThemePreference; icon: typeof SunMedium; labelKey: string }> = [
  { key: "light", icon: SunMedium, labelKey: "theme.light" },
  { key: "dark", icon: MoonStar, labelKey: "theme.dark" },
  { key: "system", icon: Monitor, labelKey: "theme.system" },
];

export const ThemeToggle = () => {
  const { t } = useTranslation();
  const { themePreference, setThemePreference } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
      {preferences.map(({ key, icon: Icon, labelKey }) => (
        <Button
          key={key}
          type="button"
          size="sm"
          variant={themePreference === key ? "secondary" : "ghost"}
          className="rounded-full px-3"
          onClick={() => setThemePreference(key)}
          aria-label={t(labelKey)}
          aria-pressed={themePreference === key}
        >
          <Icon />
          <span className="hidden sm:inline">{t(labelKey)}</span>
        </Button>
      ))}
    </div>
  );
};
