import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { MailPlus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { requestVerificationEmail } from "../api/auth-client";
import { sanitizeEmail } from "../lib/auth-utils";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const ResendVerificationForm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(sanitizeEmail(email)), [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setMessageTone("error");
      setMessage(t("validation.emailRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await requestVerificationEmail(email);
      setMessageTone("success");
      setMessage(t("auth.resendVerificationSuccess"));
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : t("auth.resendVerificationError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      <Alert>{t("auth.resendVerificationHint")}</Alert>

      <div className="space-y-2">
        <Label htmlFor="resend-verification-email">{t("auth.email")}</Label>
        <Input
          id="resend-verification-email"
          type="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isSubmitting}>
        <MailPlus />
        {isSubmitting ? t("auth.submittingResendVerification") : t("auth.submitResendVerification")}
      </Button>

      <div className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" to="/login">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </form>
  );
};
