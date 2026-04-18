import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { RegisterForm } from "../features/auth/components/RegisterForm";

export const RegisterPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("nav.register")}
      title={t("auth.registerTitle")}
      description={t("auth.registerDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("home.highlightI18n")}</div>}
    >
      <RegisterForm />
    </AuthLayout>
  );
};
