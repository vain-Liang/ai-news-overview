import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

export const ResetPasswordPage = () => {
  const { t } = useTranslation("resetPasswordPage");

  return (
    <AuthLayout
      title={t("title")}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};
