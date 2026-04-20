import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { confirmPasswordReset } from "../api/auth-client";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (!token.trim()) {
      return t("auth.resetPasswordTokenRequired");
    }
    if (!password) {
      return t("validation.passwordRequired");
    }
    if (password.length < 8) {
      return t("validation.passwordLength");
    }
    if (!confirmPassword) {
      return t("validation.confirmRequired");
    }
    if (confirmPassword !== password) {
      return t("validation.confirmMismatch");
    }
    return null;
  }, [confirmPassword, password, t, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationMessage) {
      setMessageTone("error");
      setMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({ token, password });
      setMessageTone("success");
      setMessage(t("auth.resetPasswordSuccess"));
      navigate("/login", { replace: true });
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : t("backend.offline"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      <Alert>{t("auth.resetPasswordHint")}</Alert>

      <div className="space-y-2">
        <Label htmlFor="reset-password-token">{t("auth.resetPasswordToken")}</Label>
        <Input
          id="reset-password-token"
          placeholder={t("auth.resetPasswordTokenPlaceholder")}
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password">{t("auth.newPassword")}</Label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirm">{t("auth.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="reset-password-confirm"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={Boolean(validationMessage) || isSubmitting}>
        <KeyRound />
        {isSubmitting ? t("auth.submittingResetPassword") : t("auth.submitResetPassword")}
      </Button>

      <div className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" to="/login">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </form>
  );
};
