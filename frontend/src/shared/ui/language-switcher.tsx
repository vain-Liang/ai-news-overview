import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "./button";

const languages = [
  { code: "en", labelKey: "en" },
  { code: "zh-CN", labelKey: "zhCN" },
] as const;

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("languageSwitcher");
  const currentIndex = languages.findIndex((language) => language.code === i18n.resolvedLanguage);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeLanguage = languages[activeIndex];
  const nextLanguage = languages[(activeIndex + 1) % languages.length];

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="rounded-full border border-border/60 bg-background/80 px-3"
      onClick={() => void i18n.changeLanguage(nextLanguage.code)}
      aria-label={t(nextLanguage.labelKey)}
    >
      <Languages className="size-4" />
      <span>{t(activeLanguage.labelKey)}</span>
    </Button>
  );
};
