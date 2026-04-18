import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { LoginForm } from "../features/auth/components/LoginForm";

export const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("nav.login")}
      title={t("auth.loginTitle")}
      description={t("auth.loginDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("home.highlightRoutes")}</div>}
    >
      <LoginForm />
    </AuthLayout>
  );
};
