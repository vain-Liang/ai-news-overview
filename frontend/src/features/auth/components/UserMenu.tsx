import { ChevronDown, LogOut, Settings, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { getSessionLabel } from "../lib/auth-utils";
import type { AuthUser } from "../model";
import { Avatar, AvatarFallback } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";

const MenuField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="break-all text-sm font-medium text-foreground">{value}</div>
  </div>
);

type UserMenuProps = {
  onSignOut: () => void;
  user: AuthUser;
};

export const UserMenu = ({ onSignOut, user }: UserMenuProps) => {
  const { t } = useTranslation();
  const initials = (user.nickname || user.username || user.email || "AI")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group relative z-[60]">
      <Link
        to="/me"
        className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2 py-1.5 transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label={t("profile.openProfile")}
      >
        <Avatar className="size-9 rounded-2xl">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {getSessionLabel(user)}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </Link>

      <div className="pointer-events-none absolute right-0 top-full z-[70] w-80 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="rounded-2xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur">
          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold text-foreground">{t("profile.quickMenuTitle")}</div>
              <div className="text-sm text-muted-foreground">{t("profile.quickMenuDescription")}</div>
            </div>

            <div className="grid gap-3">
              <MenuField label={t("home.username")} value={user.username || "—"} />
              <MenuField label={t("home.email")} value={user.email} />
              <MenuField label={t("home.nickname")} value={user.nickname || "—"} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link to="/me">
                  <Settings className="size-4" />
                  {t("profile.editProfile")}
                </Link>
              </Button>
              {user.is_superuser ? (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" />
                    {t("nav.admin")}
                  </Link>
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onSignOut}>
                <LogOut className="size-4" />
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
