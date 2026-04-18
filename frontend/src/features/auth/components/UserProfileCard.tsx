import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getPersistenceCopy } from "../lib/auth-utils";
import type { AuthLoginMethod, AuthPersistence, AuthUser } from "../model";
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
  authMethod: AuthLoginMethod | null;
  isAuthenticated: boolean;
  isRefreshingProfile: boolean;
  onRefreshProfile: () => void;
  onSignOut: () => void;
  persistence: AuthPersistence;
  token: string;
  user: AuthUser | null;
};

export const UserProfileCard = ({
  authMethod,
  isAuthenticated,
  isRefreshingProfile,
  onRefreshProfile,
  onSignOut,
  persistence,
  token,
  user,
}: UserProfileCardProps) => {
  const { t } = useTranslation();
  const persistenceCopy = getPersistenceCopy(persistence);
  const sessionLabel =
    authMethod === "cookie"
      ? t("home.cookieSessionManaged")
      : persistenceCopy.label;
  const sessionDescription =
    authMethod === "cookie"
      ? t("home.cookieSessionManagedDescription")
      : persistenceCopy.description;
  const tokenPreview =
    authMethod === "cookie"
      ? t("home.cookieSessionStored")
      : token
        ? `${token.slice(0, 24)}…`
        : t("home.noToken");
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
              <CardTitle>{t("home.profileTitle")}</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? t("home.profileDescriptionUser")
                  : t("home.profileDescriptionGuest")}
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
          <ProfileField label={t("home.userId")} value={user?.id ?? "—"} />
          <ProfileField
            label={t("home.authMethod")}
            value={
              authMethod === "cookie"
                ? t("home.authMethodCookie")
                : authMethod === "jwt"
                  ? t("home.authMethodJwt")
                  : "—"
            }
          />
          <ProfileField label={t("home.active")} value={String(user?.is_active ?? false)} />
          <ProfileField label={t("home.verified")} value={String(user?.is_verified ?? false)} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">{t("home.sessionTitle")}</div>
          <p className="mt-1">{sessionLabel}</p>
          <p className="mt-1">{sessionDescription}</p>
          <p className="mt-3 text-xs">
            <span className="font-medium text-foreground">{t("home.tokenPreview")}: </span>
            {tokenPreview}
          </p>
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
