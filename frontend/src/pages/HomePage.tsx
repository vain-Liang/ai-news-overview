import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { UserMenu } from "../features/auth/components/UserMenu";
import { VerificationReminderBanner } from "../features/auth/components/VerificationReminderBanner";
import { useAuth } from "../features/auth/hooks/useAuth";
import { HomepageNewsSection } from "../features/news/components/HomepageNewsSection";
import { AppShell } from "../shared/ui/app-shell";
import { Button } from "../shared/ui/button";

export const HomePage = () => {
  const { t } = useTranslation("homePage");
  const { isAuthenticated, signOut, user } = useAuth();

  return (
    <AppShell
      title={isAuthenticated && user ? t("titleUser", { name: user.nickname || user.username || user.email }) : t("titleGuest")}
      actions={
        <>
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/news">{t("primaryCta")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login">{t("loginCta")}</Link>
              </Button>
              <Button asChild>
                <Link to="/register">{t("registerCta")}</Link>
              </Button>
            </>
          )}
          {user?.is_superuser ? (
            <Button asChild variant="ghost">
              <Link to="/admin">Admin</Link>
            </Button>
          ) : null}
          {isAuthenticated && user ? <UserMenu onSignOut={() => void signOut()} user={user} /> : null}
        </>
      }
    >
      {isAuthenticated && user && !user.is_verified ? (
        <VerificationReminderBanner email={user.email} />
      ) : null}

      <HomepageNewsSection />
    </AppShell>
  );
};
