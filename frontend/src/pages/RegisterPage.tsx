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
    >
      <RegisterForm />
    </AuthLayout>
  );
};
