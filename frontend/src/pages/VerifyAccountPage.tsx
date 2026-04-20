import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { VerifyAccountCard } from "../features/auth/components/VerifyAccountCard";

export const VerifyAccountPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout
      eyebrow={t("auth.verifyAccountTitle")}
      title={t("auth.verifyAccountTitle")}
      description={t("auth.verifyAccountDescription")}
      footer={<div className="text-center text-sm text-muted-foreground">{t("auth.verifyAccountFooter")}</div>}
    >
      <VerifyAccountCard />
    </AuthLayout>
  );
};
