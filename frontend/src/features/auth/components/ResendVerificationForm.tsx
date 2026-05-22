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
  const { t } = useTranslation("resendVerificationForm");
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
      setMessage(t("validationEmailRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await requestVerificationEmail(email);
      setMessageTone("success");
      setMessage(t("success"));
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
      <Alert>{t("hint")}</Alert>

      <div className="space-y-2">
        <Label htmlFor="resend-verification-email">{t("email")}</Label>
        <Input
          id="resend-verification-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isSubmitting}>
        <MailPlus />
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <div className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" to="/login">
          {t("backToLogin")}
        </Link>
      </div>
    </form>
  );
};
