import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { RegisterForm } from "../features/auth/components/RegisterForm";

export const RegisterPage = () => {
  const { t } = useTranslation("registerPage");

  return (
    <AuthLayout title={t("title")}>
      <RegisterForm />
    </AuthLayout>
  );
};
