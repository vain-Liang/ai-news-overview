import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AuthUser } from "../model";
import { Avatar, AvatarFallback } from "../../../shared/ui/avatar";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 break-all text-sm font-medium">{value}</div>
  </div>
);

type UserProfileCardProps = {
  isAuthenticated: boolean;
  isRefreshingProfile: boolean;
  onRefreshProfile: () => void;
  onSignOut: () => void;
  user: AuthUser | null;
};

export const UserProfileCard = ({
  isAuthenticated,
  isRefreshingProfile,
  onRefreshProfile,
  onSignOut,
  user,
}: UserProfileCardProps) => {
  const { t } = useTranslation();
  const initials = (user?.nickname || user?.username || user?.email || "AI")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{t("profile.overviewTitle")}</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? t("profile.overviewDescriptionUser")
                  : t("profile.overviewDescriptionGuest")}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isAuthenticated ? "success" : "secondary"}>
            <UserRound className="size-3.5" />
            {isAuthenticated ? t("common.online") : t("common.offline")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField label={t("home.email")} value={user?.email ?? t("home.notSignedIn")} />
          <ProfileField label={t("home.username")} value={user?.username ?? "—"} />
          <ProfileField label={t("home.nickname")} value={user?.nickname ?? "—"} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onRefreshProfile}
            disabled={!isAuthenticated || isRefreshingProfile}
          >
            {t("home.refreshProfile")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSignOut}
            disabled={!isAuthenticated}
          >
            {t("home.signOut")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
