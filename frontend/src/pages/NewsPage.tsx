import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { UserMenu } from "../features/auth/components/UserMenu";
import { useAuth } from "../features/auth/hooks/useAuth";
import { HomepageNewsSection } from "../features/news/components/HomepageNewsSection";
import { NewsIngestSection } from "../features/news/components/NewsIngestSection";
import { Button } from "../shared/ui/button";
import { LanguageSwitcher } from "../shared/ui/language-switcher";
import { Separator } from "../shared/ui/separator";
import { ThemeToggle } from "../shared/ui/theme-toggle";

export const NewsPage = () => {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <div>
              <div className="font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="text-sm text-muted-foreground">{t("news.pageEyebrow")}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" />
                {t("nav.home")}
              </Link>
            </Button>
            {user ? <UserMenu onSignOut={() => void signOut()} user={user} /> : null}
          </div>
        </header>

        <HomepageNewsSection refreshToken={refreshToken} />

        <Separator />

        <NewsIngestSection onIngested={() => setRefreshToken((current) => current + 1)} />
      </div>
    </main>
  );
};
