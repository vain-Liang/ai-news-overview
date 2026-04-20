import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("auth.forgotPasswordTitle")}
      title={t("auth.forgotPasswordTitle")}
      description={t("auth.forgotPasswordDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("auth.forgotPasswordFooter")}</div>}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};
