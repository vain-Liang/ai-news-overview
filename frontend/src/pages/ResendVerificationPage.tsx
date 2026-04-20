import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ResendVerificationForm } from "../features/auth/components/ResendVerificationForm";

export const ResendVerificationPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("auth.resendVerificationTitle")}
      title={t("auth.resendVerificationTitle")}
      description={t("auth.resendVerificationDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("auth.resendVerificationFooter")}</div>}
    >
      <ResendVerificationForm />
    </AuthLayout>
  );
};
