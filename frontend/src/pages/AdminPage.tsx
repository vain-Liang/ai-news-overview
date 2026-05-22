import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { AdminUserManagementCard } from "../features/admin/components/AdminUserManagementCard";
import { AdminWorkflowManagementCard } from "../features/admin/components/AdminWorkflowManagementCard";
import { UserMenu } from "../features/auth/components/UserMenu";
import { useAuth } from "../features/auth/hooks/useAuth";
import { RuntimeStatusCard } from "../features/system/components/RuntimeStatusCard";
import { AppShell } from "../shared/ui/app-shell";
import { Button } from "../shared/ui/button";

export const AdminPage = () => {
  const { t } = useTranslation("adminPage");
  const { backendState, signOut, user } = useAuth();

  return (
    <AppShell
      title={t("title")}
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link to="/news">News</Link>
          </Button>
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ShieldCheck className="size-3.5" />
              {t("eyebrow")}
            </div>
          </div>
          <RuntimeStatusCard backendState={backendState} />
        </section>

        {user ? <AdminUserManagementCard currentUserId={user.id} /> : null}

        {user ? <AdminWorkflowManagementCard /> : null}
      </div>
    </AppShell>
  );
};
