import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ResendVerificationForm } from "../features/auth/components/ResendVerificationForm";

export const ResendVerificationPage = () => {
  const { t } = useTranslation("resendVerificationPage");

  return (
    <AuthLayout
      title={t("title")}
    >
      <ResendVerificationForm />
    </AuthLayout>
  );
};
