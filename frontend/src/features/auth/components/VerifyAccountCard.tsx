import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { confirmAccountVerification } from "../api/auth-client";
import { Alert } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

export const VerifyAccountCard = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const verificationEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const isEmailChangeMode = useMemo(() => searchParams.get("mode") === "email-change", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(initialToken ? "loading" : "idle");
  const [message, setMessage] = useState<string | null>(null);

  const buildSuccessMessage = useCallback(
    (email: string) =>
      isEmailChangeMode
        ? t("auth.verifyEmailChangeSuccess", { email })
        : t("auth.verifyAccountSuccess", { email }),
    [isEmailChangeMode, t],
  );

  const verifyToken = useCallback(
    async (nextToken: string) => {
      setStatus("loading");
      try {
        const user = await confirmAccountVerification(nextToken);
        setStatus("success");
        setMessage(buildSuccessMessage(user.email));
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : t("auth.verifyAccountError"));
      }
    },
    [buildSuccessMessage, t],
  );

  useEffect(() => {
    if (!initialToken) {
      return;
    }

    let cancelled = false;

    const runAutoVerification = async () => {
      try {
        const user = await confirmAccountVerification(initialToken);
        if (cancelled) {
          return;
        }
        setStatus("success");
        setMessage(buildSuccessMessage(user.email));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setMessage(error instanceof Error ? error.message : t("auth.verifyAccountError"));
      }
    };

    void runAutoVerification();

    return () => {
      cancelled = true;
    };
  }, [buildSuccessMessage, initialToken, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.verifyAccountTitle")}</CardTitle>
        <CardDescription>{t("auth.verifyAccountDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {status === "loading" ? (
          <Alert>
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              {t("auth.verifyingAccount")}
            </span>
          </Alert>
        ) : null}

        {status === "success" && message ? (
          <Alert variant="success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {message}
            </span>
          </Alert>
        ) : null}

        {status === "error" && message ? <Alert variant="error">{message}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="verify-account-token">{t("auth.verifyAccountToken")}</Label>
          <Input
            id="verify-account-token"
            value={token}
            placeholder={t("auth.verifyAccountTokenPlaceholder")}
            onChange={(event) => {
              setToken(event.target.value);
              setStatus("idle");
              setMessage(null);
            }}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={() => void verifyToken(token.trim())}
          disabled={!token.trim() || status === "loading"}
        >
          {t("auth.submitVerifyAccount")}
        </Button>

        <div className="text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" to="/login">
            {t("auth.backToLogin")}
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" to="/resend-verification">
            {t("auth.switchToResendVerification")}
          </Link>
        </div>
        {verificationEmail ? (
          <div className="text-xs text-muted-foreground">
            {t("auth.verifyAccountResendHint", { email: verificationEmail })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
