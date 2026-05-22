import { Sparkles } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

type AppShellProps = PropsWithChildren<{
  actions?: ReactNode;
  title?: string;
}>;

export const AppShell = ({
  actions,
  children,
  title,
}: AppShellProps) => {
  const { t } = useTranslation("appShell");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
                  aria-label={t("backToHome")}
                >
                  <Sparkles className="size-5" />
                </Link>
                <div className="space-y-1">
                  <div className="text-xl font-semibold tracking-tight text-foreground">
                    {t("appName")}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                {actions}
              </div>
            </div>

            {title ? (
              <div>
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </main>
  );
};

export const AppSection = ({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) => (
  <section className="space-y-5">
    {title ? (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
    ) : null}
    {children}
  </section>
);
