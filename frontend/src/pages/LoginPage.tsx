import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { LoginForm } from "../features/auth/components/LoginForm";

export const LoginPage = () => {
  const { t } = useTranslation("loginPage");

  return (
    <AuthLayout title={t("title")}>
      <LoginForm />
    </AuthLayout>
  );
};
