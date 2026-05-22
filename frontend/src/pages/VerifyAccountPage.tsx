import { useTranslation } from "react-i18next";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { VerifyAccountCard } from "../features/auth/components/VerifyAccountCard";

export const VerifyAccountPage = () => {
  const { t } = useTranslation("verifyAccountPage");

  return (
    <AuthLayout
      title={t("title")}
    >
      <VerifyAccountCard />
    </AuthLayout>
  );
};
