import type { PropsWithChildren, ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { AppShell } from "../../../shared/ui/app-shell";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  footer?: ReactNode;
}>;

export const AuthLayout = ({
  title,
  footer,
  children,
}: AuthLayoutProps) => {
  const { t } = useTranslation("authLayout");
  const { pathname } = useLocation();

  return (
    <AppShell
      title={title}
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">{t("backHome")}</Link>
          </Button>
          {pathname !== "/login" ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">{t("signIn")}</Link>
            </Button>
          ) : null}
          {pathname !== "/register" ? (
            <Button asChild size="sm">
              <Link to="/register">{t("createAccount")}</Link>
            </Button>
          ) : null}
        </>
      }
    >
      <section className="mx-auto flex w-full max-w-xl">
        <Card className="w-full">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl sm:text-4xl">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">{children}</CardContent>
        </Card>
      </section>
      {footer ? <div className="mx-auto w-full max-w-xl text-center">{footer}</div> : null}
    </AppShell>
  );
};
