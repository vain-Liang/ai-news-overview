import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { UserMenu } from "../features/auth/components/UserMenu";
import { VerificationReminderBanner } from "../features/auth/components/VerificationReminderBanner";
import { useAuth } from "../features/auth/hooks/useAuth";
import { HomepageNewsSection } from "../features/news/components/HomepageNewsSection";
import { Button } from "../shared/ui/button";
import { LanguageSwitcher } from "../shared/ui/language-switcher";
import { ThemeToggle } from "../shared/ui/theme-toggle";

export const HomePage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, signOut, user } = useAuth();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="relative z-40 flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <div>
              <div className="font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="text-sm text-muted-foreground">{t("home.eyebrow")}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost">
              <Link to="/news">{t("nav.news")}</Link>
            </Button>
            {user?.is_superuser ? (
              <Button asChild variant="ghost">
                <Link to="/admin">{t("nav.admin")}</Link>
              </Button>
            ) : null}
            <LanguageSwitcher />
            <ThemeToggle />
            {isAuthenticated && user ? (
              <UserMenu onSignOut={() => void signOut()} user={user} />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {isAuthenticated && user && !user.is_verified ? (
          <VerificationReminderBanner email={user.email} />
        ) : null}

        <HomepageNewsSection />
      </div>
    </main>
  );
};
