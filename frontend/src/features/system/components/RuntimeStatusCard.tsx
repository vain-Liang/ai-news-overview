import { Activity, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BackendState } from "../../auth/model";
import { Badge } from "../../../shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";

const StatusItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-medium">{value}</div>
  </div>
);

export const RuntimeStatusCard = ({ backendState }: { backendState: BackendState }) => {
  const { t } = useTranslation();
  const runtime = backendState.runtime;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{t("home.runtimeTitle")}</CardTitle>
            <CardDescription>{t("home.runtimeDescription")}</CardDescription>
          </div>
          <Badge variant={backendState.kind === "online" ? "success" : backendState.kind === "offline" ? "danger" : "secondary"}>
            <Activity className="size-3.5" />
            {backendState.kind === "online" ? t("common.online") : backendState.kind === "offline" ? t("common.offline") : t("common.loading")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
          {backendState.message}
        </div>

        {runtime ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusItem label={t("home.runtimeAppName")} value={runtime.app_name} />
              <StatusItem label={t("home.runtimeMode")} value={runtime.debug ? "debug" : "production"} />
              <StatusItem label={t("home.runtimeLastUpdated")} value={runtime.server_time} />
              <StatusItem label={t("home.runtimeAdmin")} value={runtime.admin.api_prefix} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                {t("home.runtimeAuth")}
              </div>
              <ul className="space-y-2 font-mono text-xs sm:text-sm">
                <li>{runtime.auth.register_path}</li>
                <li>{runtime.auth.login_path}</li>
                <li>{runtime.auth.me_path}</li>
                <li>{runtime.admin.api_prefix}</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            {t("home.runtimeUnavailable")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
