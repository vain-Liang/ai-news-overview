import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";

export const ForgotPasswordPage = () => {
  const { t } = useTranslation("forgotPasswordPage");

  return (
    <AuthLayout
      title={t("title")}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};
