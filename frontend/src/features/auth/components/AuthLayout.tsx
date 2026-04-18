import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";
import { LanguageSwitcher } from "../../../shared/ui/language-switcher";
import { ThemeToggle } from "../../../shared/ui/theme-toggle";

type AuthLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
}>;

export const AuthLayout = ({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) => {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-foreground">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <span>{t("common.appName")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader className="space-y-4">
              <Badge className="w-fit" variant="default">
                {eyebrow}
              </Badge>
              <CardTitle className="max-w-2xl text-3xl sm:text-4xl">{title}</CardTitle>
              <CardDescription className="max-w-2xl text-base">{description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">{children}</CardContent>
          </Card>
        </section>

        <div>{footer}</div>
      </div>
    </main>
  );
};
