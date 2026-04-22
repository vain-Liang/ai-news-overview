import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { AdminUserManagementCard } from "../features/admin/components/AdminUserManagementCard";
import { UserMenu } from "../features/auth/components/UserMenu";
import { useAuth } from "../features/auth/hooks/useAuth";
import { RuntimeStatusCard } from "../features/system/components/RuntimeStatusCard";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { LanguageSwitcher } from "../shared/ui/language-switcher";
import { ThemeToggle } from "../shared/ui/theme-toggle";

export const AdminPage = () => {
  const { t } = useTranslation();
  const { backendState, signOut, user } = useAuth();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <div>
              <div className="font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="text-sm text-muted-foreground">{t("admin.pageEyebrow")}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/news">{t("nav.news")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" />
                {t("nav.home")}
              </Link>
            </Button>
            {user ? <UserMenu onSignOut={() => void signOut()} user={user} /> : null}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background">
            <CardHeader className="space-y-4">
              <Badge className="w-fit">
                <ShieldCheck className="size-3.5" />
                {t("admin.badge")}
              </Badge>
              <CardTitle className="max-w-3xl text-3xl sm:text-4xl">{t("admin.pageTitle")}</CardTitle>
              <CardDescription className="max-w-3xl text-base sm:text-lg">
                {t("admin.pageDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{t("admin.apiEntry")}</div>
                <p className="mt-2 font-mono text-xs sm:text-sm">
                  {backendState.runtime?.admin.api_prefix ?? "/admin/"}
                </p>
              </div>
            </CardContent>
          </Card>

          <RuntimeStatusCard backendState={backendState} />
        </section>

        {user ? <AdminUserManagementCard currentUserId={user.id} /> : null}
      </div>
    </main>
  );
};
