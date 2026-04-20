import { useState } from "react";
import { AlertTriangle, BadgeCheck, MailPlus } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { requestVerificationEmail } from "../api/auth-client";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";

type VerificationReminderBannerProps = {
  email: string;
};

export const VerificationReminderBanner = ({
  email,
}: VerificationReminderBannerProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success",
  );

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      await requestVerificationEmail(email);
      setMessageTone("success");
      setMessage(t("auth.resendVerificationSuccess"));
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : t("auth.resendVerificationError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
            <AlertTriangle className="size-3.5" />
            {t("auth.unverifiedBannerBadge")}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t("auth.unverifiedBannerTitle")}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("auth.unverifiedBannerDescription", { email })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleResend()}
            disabled={isSubmitting}
          >
            <MailPlus />
            {isSubmitting
              ? t("auth.submittingResendVerification")
              : t("auth.submitResendVerification")}
          </Button>
          <Button asChild>
            <Link
              to={`/verify-account${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            >
              <BadgeCheck />
              {t("auth.goToVerifyAccount")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              to={`/resend-verification?email=${encodeURIComponent(email)}`}
            >
              {t("auth.openResendVerificationPage")}
            </Link>
          </Button>
        </div>
      </div>
      {message ? <Alert variant={messageTone}>{message}</Alert> : null}
    </section>
  );
};
