import { Activity, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BackendState } from "../../auth/model";
import { Badge } from "../../../shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";

export const RuntimeStatusCard = ({ backendState }: { backendState: BackendState }) => {
  const { t } = useTranslation("runtimeStatusCard");
  const statusLabel =
    backendState.kind === "online"
      ? t("online")
      : backendState.kind === "offline"
        ? t("offline")
        : t("checking");
  const isHealthy = backendState.kind === "online";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{t("title")}</CardTitle>
          </div>
          <Badge variant={backendState.kind === "online" ? "success" : backendState.kind === "offline" ? "danger" : "secondary"}>
            <Activity className="size-3.5" />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {isHealthy ? t("healthyTitle") : backendState.kind === "offline" ? t("unavailableTitle") : t("pendingTitle")}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isHealthy ? t("healthyDescription") : backendState.kind === "offline" ? t("unavailableDescription") : t("pendingDescription")}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("response")}</div>
          <div className="mt-2">{backendState.message}</div>
        </div>
      </CardContent>
    </Card>
  );
};
