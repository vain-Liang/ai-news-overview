import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "./button";

const languages = [
  { code: "en", labelKey: "language.en" },
  { code: "zh-CN", labelKey: "language.zhCN" },
] as const;

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
      <span className="inline-flex items-center px-2 text-muted-foreground">
        <Languages className="size-4" />
      </span>
      {languages.map((language) => (
        <Button
          key={language.code}
          type="button"
          size="sm"
          variant={i18n.resolvedLanguage === language.code ? "secondary" : "ghost"}
          className="rounded-full px-3"
          onClick={() => void i18n.changeLanguage(language.code)}
        >
          {t(language.labelKey)}
        </Button>
      ))}
    </div>
  );
};
