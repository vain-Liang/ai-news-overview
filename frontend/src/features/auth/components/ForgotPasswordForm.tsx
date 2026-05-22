import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { requestPasswordReset } from "../api/auth-client";
import { sanitizeEmail } from "../lib/auth-utils";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const ForgotPasswordForm = () => {
  const { t } = useTranslation("forgotPasswordForm");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(sanitizeEmail(email)), [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setMessageTone("error");
      setMessage(t("validationEmailRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setMessageTone("success");
      setMessage(t("success"));
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : t("backendOffline"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      <Alert>{t("hint")}</Alert>

      <div className="space-y-2">
        <Label htmlFor="forgot-password-email">{t("email")}</Label>
        <Input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isSubmitting}>
        <MailCheck />
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <Button asChild type="button" variant="ghost" className="w-full justify-center">
        <Link to="/login">
          <ArrowLeft />
          {t("backToLogin")}
        </Link>
      </Button>
    </form>
  );
};
