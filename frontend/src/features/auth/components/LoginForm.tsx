import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import {
  getLoginMethodCopy,
  getPersistenceCopy,
  isLoginFormComplete,
} from "../lib/auth-utils";
import {
  initialLoginForm,
  type AuthLoginMethod,
  type AuthPersistence,
} from "../model";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { cn } from "../../../shared/lib/utils";
import { Switch } from "../../../shared/ui/switch";

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { backendState, isAuthenticating, persistence, setPersistence, signIn } = useAuth();
  const [form, setForm] = useState(initialLoginForm);
  const [loginMethod, setLoginMethod] = useState<AuthLoginMethod>("jwt");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  const canSubmit = useMemo(() => isLoginFormComplete(form), [form]);
  const persistenceCopy = getPersistenceCopy(persistence);
  const loginMethodCopy = getLoginMethodCopy(loginMethod);
  const isCookieLogin = loginMethod === "cookie";

  const updatePersistence = (checked: boolean) => {
    setPersistence(checked ? "local" : "session");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setMessageTone("error");
      setMessage(t("auth.invalidLogin"));
      return;
    }

    const result = await signIn(
      form,
      persistence as AuthPersistence,
      loginMethod,
    );

    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }

    setMessageTone("success");
    setMessage(t("auth.loginSuccess"));
    navigate("/", { replace: true });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      {backendState.kind === "offline" ? <Alert variant="error">{backendState.message}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="login-email">{t("auth.email")}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{t("auth.password")}</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("auth.passwordPlaceholder")}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="pr-12"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition hover:text-foreground"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">{t("auth.loginMethod")}</div>
          <p className="text-sm text-muted-foreground">
            {t("auth.loginMethodHelp")}
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["jwt", "cookie"] as const).map((method) => {
            const copy = getLoginMethodCopy(method);
            const isSelected = loginMethod === method;

            return (
              <button
                key={method}
                type="button"
                onClick={() => setLoginMethod(method)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
                aria-pressed={isSelected}
              >
                <div className="text-sm font-medium text-foreground">
                  {copy.label}
                </div>
                <div className="mt-1 text-xs">{copy.description}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {loginMethodCopy.description}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {isCookieLogin ? t("auth.cookieSession") : t("auth.rememberMe")}
            </div>
            <p className="text-sm text-muted-foreground">
              {isCookieLogin
                ? t("auth.cookieSessionHelp")
                : t("auth.rememberHelp")}
            </p>
          </div>
          <Switch
            checked={persistence === "local"}
            onCheckedChange={updatePersistence}
            aria-label={
              isCookieLogin ? t("auth.cookieSession") : t("auth.rememberMe")
            }
            disabled={isCookieLogin}
          />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <strong className="mr-1 text-foreground">
            {isCookieLogin ? t("auth.cookieSessionManaged") : persistenceCopy.label}
          </strong>
          {isCookieLogin
            ? t("auth.cookieSessionManagedDescription")
            : persistenceCopy.description}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSubmit || isAuthenticating || backendState.kind === "offline"}
      >
        <LogIn />
        {isAuthenticating ? t("auth.submittingLogin") : t("auth.submitLogin")}
      </Button>

      <div className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" to="/forgot-password">
          {t("auth.switchToForgotPassword")}
        </Link>
      </div>

      <div className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" to="/resend-verification">
          {t("auth.switchToResendVerification")}
        </Link>
      </div>

      <div className="text-sm text-muted-foreground">
        {t("auth.createInstead")}{" "}
        <Link className="font-medium text-primary hover:underline" to="/register">
          {t("auth.switchToRegister")}
        </Link>
      </div>
    </form>
  );
};
