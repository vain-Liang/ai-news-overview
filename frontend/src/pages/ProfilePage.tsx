import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { requestPasswordReset } from "../features/auth/api/auth-client";
import { UserMenu } from "../features/auth/components/UserMenu";
import { UserProfileCard } from "../features/auth/components/UserProfileCard";
import { useAuth } from "../features/auth/hooks/useAuth";
import { normalizeOptionalText, sanitizeEmail } from "../features/auth/lib/auth-utils";
import { Alert } from "../shared/ui/alert";
import { AppShell } from "../shared/ui/app-shell";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/ui/card";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";

export const ProfilePage = () => {
  const { t } = useTranslation("profilePage");
  const {
    isAuthenticated,
    isRefreshingProfile,
    refreshProfile,
    signOut,
    updateProfile,
    user,
  } = useAuth();
  const baselineEmail = user?.pending_email ?? user?.email ?? "";
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileTone, setProfileTone] = useState<"success" | "error">("success");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetTone, setResetTone] = useState<"success" | "error">("success");
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  useEffect(() => {
    setEmail(baselineEmail);
    setNickname(user?.nickname ?? "");
  }, [baselineEmail, user]);

  const profileValidationMessage = useMemo(() => {
    if (!sanitizeEmail(email)) {
      return t("validationEmailRequired");
    }

    const normalizedEmail = sanitizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return t("validationEmailInvalid");
    }

    const normalizedNickname = normalizeOptionalText(nickname);
    if (normalizedNickname && normalizedNickname.length > 100) {
      return t("nicknameTooLong");
    }

    return null;
  }, [email, nickname, t]);

  const hasProfileChanges =
    sanitizeEmail(email) !== sanitizeEmail(baselineEmail) ||
    normalizeOptionalText(nickname) !== normalizeOptionalText(user?.nickname ?? "");

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (profileValidationMessage) {
      setProfileTone("error");
      setProfileMessage(profileValidationMessage);
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);
    const result = await updateProfile({ email, nickname });
    setIsSavingProfile(false);

    if (result.ok) {
      setProfileTone("success");
      setProfileMessage(result.message || t("updateSuccess"));
      return;
    }

    setProfileTone("error");
    setProfileMessage(result.message);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setResetTone("error");
      setResetMessage(t("validationEmailRequired"));
      return;
    }

    setIsRequestingReset(true);
    setResetMessage(null);

    try {
      await requestPasswordReset(user.email);
      setResetTone("success");
      setResetMessage(t("resetPasswordSuccess"));
    } catch (error) {
      setResetTone("error");
      setResetMessage(error instanceof Error ? error.message : "Unable to reach the backend.");
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <AppShell
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">

          <UserProfileCard
            isAuthenticated={isAuthenticated}
            isRefreshingProfile={isRefreshingProfile}
            onRefreshProfile={() => void refreshProfile()}
            onSignOut={() => void signOut()}
            user={user}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("editTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleProfileSubmit}>
              {profileMessage ? <Alert variant={profileTone}>{profileMessage}</Alert> : null}
              {user?.pending_email ? (
                <Alert>
                  <div className="space-y-1">
                      <div className="font-medium">{t("pendingEmailTitle")}</div>
                      <div>{t("pendingEmailDescription", { email: user.pending_email })}</div>
                    </div>
                  </Alert>
                ) : null}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profile-email">{t("fieldEmail")}</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">{t("fieldUsername")}</Label>
                    <Input
                      id="profile-username"
                      value={user?.username ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-nickname">{t("fieldNickname")}</Label>
                    <Input
                      id="profile-nickname"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="Morning Briefing"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={Boolean(profileValidationMessage) || !hasProfileChanges || isSavingProfile}
                  >
                    {isSavingProfile ? t("saving") : t("saveChanges")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEmail(baselineEmail);
                      setNickname(user?.nickname ?? "");
                      setProfileMessage(null);
                    }}
                    disabled={isSavingProfile}
                  >
                    {t("resetForm")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("resetPasswordTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetMessage ? <Alert variant={resetTone}>{resetMessage}</Alert> : null}
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Mail className="size-4" />
                  {user?.email ?? t("notSignedIn")}
                </div>
                <p className="mt-2">{t("resetPasswordHint")}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handlePasswordReset()}
                disabled={!user?.email || isRequestingReset}
              >
                {isRequestingReset ? t("requestingReset") : t("sendResetInstructions")}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
};
