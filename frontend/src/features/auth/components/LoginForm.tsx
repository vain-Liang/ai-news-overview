import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { isLoginFormComplete } from "../lib/auth-utils";
import { initialLoginForm } from "../model";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { backendState, isAuthenticating, signIn } = useAuth();
  const [form, setForm] = useState(initialLoginForm);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  const canSubmit = useMemo(() => isLoginFormComplete(form), [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setMessageTone("error");
      setMessage(t("auth.invalidLogin"));
      return;
    }

    const result = await signIn(form);

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
