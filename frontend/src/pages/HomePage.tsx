import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/hooks/useAuth";
import { RuntimeStatusCard } from "../features/system/components/RuntimeStatusCard";
import { UserProfileCard } from "../features/auth/components/UserProfileCard";
import { VerificationReminderBanner } from "../features/auth/components/VerificationReminderBanner";
import { HomepageNewsSection } from "../features/news/components/HomepageNewsSection";
import { getSessionLabel } from "../features/auth/lib/auth-utils";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { LanguageSwitcher } from "../shared/ui/language-switcher";
import { ThemeToggle } from "../shared/ui/theme-toggle";

export const HomePage = () => {
  const { t } = useTranslation();
  const {
    authMethod,
    backendState,
    isAuthenticated,
    isRefreshingProfile,
    persistence,
    refreshProfile,
    signOut,
    token,
    user,
  } = useAuth();

  const displayName = getSessionLabel(user);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <div>
              <div className="font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="text-sm text-muted-foreground">{t("home.eyebrow")}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void signOut()}
              >
                {t("nav.logout")}
              </Button>
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

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background">
            <CardHeader className="space-y-4">
              <Badge className="w-fit">
                <Sparkles className="size-3.5" />
                {t("home.eyebrow")}
              </Badge>
              <CardTitle className="max-w-3xl text-3xl sm:text-5xl">
                {isAuthenticated
                  ? t("home.titleUser", { name: displayName })
                  : t("home.titleGuest")}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base sm:text-lg">
                {isAuthenticated
                  ? t("home.descriptionUser")
                  : t("home.descriptionGuest")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Button type="button" size="lg" onClick={() => void refreshProfile()}>
                      {t("home.refreshProfile")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => void signOut()}
                    >
                      {t("home.signOut")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link to="/login">
                        {t("home.loginCta")}
                        <ArrowRight />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/register">{t("home.registerCta")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <RuntimeStatusCard backendState={backendState} />
        </section>

        <HomepageNewsSection />

        <UserProfileCard
          authMethod={authMethod}
          isAuthenticated={isAuthenticated}
          isRefreshingProfile={isRefreshingProfile}
          onRefreshProfile={() => void refreshProfile()}
          onSignOut={() => void signOut()}
          persistence={persistence}
          token={token}
          user={user}
        />
      </div>
    </main>
  );
};
