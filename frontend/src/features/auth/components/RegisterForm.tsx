import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import {
  getRegisterFieldErrors,
  getRegisterValidationMessage,
} from "../lib/auth-utils";
import { initialRegisterForm } from "../model";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { backendState, isAuthenticating, register } = useAuth();
  const [form, setForm] = useState(initialRegisterForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  const fieldErrors = useMemo(() => getRegisterFieldErrors(form), [form]);
  const validationMessage = useMemo(() => getRegisterValidationMessage(form), [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationMessage) {
      setMessageTone("error");
      setMessage(validationMessage);
      return;
    }

    const result = await register({
      email: form.email,
      password: form.password,
      username: form.username,
      nickname: form.nickname,
    });

    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }

    setMessageTone("success");
    setMessage(t("auth.registerSuccess"));
    navigate("/", { replace: true });
  };

  const renderError = (value?: string) =>
    value ? <p className="text-xs text-destructive">{value}</p> : null;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      {backendState.kind === "offline" ? <Alert variant="error">{backendState.message}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="register-email">{t("auth.email")}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        {renderError(fieldErrors.email)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="register-username">{t("auth.username")}</Label>
          <Input
            id="register-username"
            autoComplete="username"
            placeholder={t("auth.usernamePlaceholder")}
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {t("common.optional")} · {t("auth.usernameImmutableHint")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-nickname">{t("auth.nickname")}</Label>
          <Input
            id="register-nickname"
            autoComplete="nickname"
            placeholder={t("auth.nicknamePlaceholder")}
            value={form.nickname}
            onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{t("common.optional")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{t("auth.password")}</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        <p className="text-xs text-muted-foreground">{t("auth.passwordRuleHint")}</p>
        {renderError(fieldErrors.password)}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">{t("auth.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            className="pr-12"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition hover:text-foreground"
            onClick={() => setShowConfirmPassword((current) => !current)}
            aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {renderError(fieldErrors.confirmPassword)}
      </div>

      <Alert>{t("auth.validationHint")}</Alert>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={Boolean(validationMessage) || isAuthenticating || backendState.kind === "offline"}
      >
        <UserPlus />
        {isAuthenticating ? t("auth.submittingRegister") : t("auth.submitRegister")}
      </Button>

      <div className="text-sm text-muted-foreground">
        {t("auth.loginInstead")}{" "}
        <Link className="font-medium text-primary hover:underline" to="/login">
          {t("auth.switchToLogin")}
        </Link>
      </div>
    </form>
  );
};
