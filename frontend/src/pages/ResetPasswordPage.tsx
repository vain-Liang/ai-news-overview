import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

export const ResetPasswordPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("auth.resetPasswordTitle")}
      title={t("auth.resetPasswordTitle")}
      description={t("auth.resetPasswordDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("auth.resetPasswordFooter")}</div>}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};
