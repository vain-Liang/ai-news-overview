import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { UserMenu } from "../features/auth/components/UserMenu";
import { useAuth } from "../features/auth/hooks/useAuth";
import { HomepageNewsSection } from "../features/news/components/HomepageNewsSection";
import { NewsIngestSection } from "../features/news/components/NewsIngestSection";
import { NewsSearchSection } from "../features/news/components/NewsSearchSection";
import { NewsSummarySection } from "../features/news/components/NewsSummarySection";
import { AppShell } from "../shared/ui/app-shell";
import { Button } from "../shared/ui/button";
import { Separator } from "../shared/ui/separator";

export const NewsPage = () => {
  const { t } = useTranslation("newsPage");
  const { signOut, user } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <AppShell
      title={t("title")}
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
          {user ? <UserMenu onSignOut={() => void signOut()} user={user} /> : null}
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <HomepageNewsSection refreshToken={refreshToken} />

        <Separator />
        <NewsSearchSection />
        <Separator />
        <NewsSummarySection />
        <Separator />
        <NewsIngestSection onIngested={() => setRefreshToken((current) => current + 1)} />
      </div>
    </AppShell>
  );
};
