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
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { LanguageSwitcher } from "../shared/ui/language-switcher";
import { ThemeToggle } from "../shared/ui/theme-toggle";

export const ProfilePage = () => {
  const { t } = useTranslation();
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
      return t("validation.emailRequired");
    }

    const normalizedEmail = sanitizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return t("validation.emailInvalid");
    }

    const normalizedNickname = normalizeOptionalText(nickname);
    if (normalizedNickname && normalizedNickname.length > 100) {
      return t("profile.nicknameTooLong");
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
      setProfileMessage(result.message || t("profile.updateSuccess"));
      return;
    }

    setProfileTone("error");
    setProfileMessage(result.message);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setResetTone("error");
      setResetMessage(t("validation.emailRequired"));
      return;
    }

    setIsRequestingReset(true);
    setResetMessage(null);

    try {
      await requestPasswordReset(user.email);
      setResetTone("success");
      setResetMessage(t("profile.resetPasswordSuccess"));
    } catch (error) {
      setResetTone("error");
      setResetMessage(error instanceof Error ? error.message : t("backend.offline"));
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="relative z-40 flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">AI</span>
            <div>
              <div className="font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="text-sm text-muted-foreground">{t("profile.pageEyebrow")}</div>
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

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background">
            <CardHeader className="space-y-4">
              <Badge className="w-fit">
                <ShieldCheck className="size-3.5" />
                {t("profile.badge")}
              </Badge>
              <CardTitle className="max-w-3xl text-3xl sm:text-4xl">{t("profile.pageTitle")}</CardTitle>
              <CardDescription className="max-w-3xl text-base sm:text-lg">
                {t("profile.pageDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{t("profile.securityTitle")}</div>
                <p className="mt-2">{t("profile.securityDescription")}</p>
              </div>
            </CardContent>
          </Card>

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
              <CardTitle>{t("profile.editTitle")}</CardTitle>
              <CardDescription>{t("profile.editDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                {profileMessage ? <Alert variant={profileTone}>{profileMessage}</Alert> : null}
                {user?.pending_email ? (
                  <Alert>
                    <div className="space-y-1">
                      <div className="font-medium">{t("profile.pendingEmailTitle")}</div>
                      <div>{t("profile.pendingEmailDescription", { email: user.pending_email })}</div>
                    </div>
                  </Alert>
                ) : null}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profile-email">{t("home.email")}</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t("auth.emailPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">{t("home.username")}</Label>
                    <Input
                      id="profile-username"
                      value={user?.username ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-nickname">{t("home.nickname")}</Label>
                    <Input
                      id="profile-nickname"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder={t("auth.nicknamePlaceholder")}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={Boolean(profileValidationMessage) || !hasProfileChanges || isSavingProfile}
                  >
                    {isSavingProfile ? t("profile.saving") : t("profile.saveChanges")}
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
                    {t("profile.resetForm")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("profile.resetPasswordTitle")}</CardTitle>
              <CardDescription>{t("profile.resetPasswordDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetMessage ? <Alert variant={resetTone}>{resetMessage}</Alert> : null}
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Mail className="size-4" />
                  {user?.email ?? t("home.notSignedIn")}
                </div>
                <p className="mt-2">{t("profile.resetPasswordHint")}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handlePasswordReset()}
                disabled={!user?.email || isRequestingReset}
              >
                {isRequestingReset ? t("profile.requestingReset") : t("profile.sendResetInstructions")}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};
