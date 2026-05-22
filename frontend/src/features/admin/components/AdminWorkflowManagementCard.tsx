import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  cancelWorkflowTask,
  fetchAdminWorkflows,
  resummarizeWorkflow,
  retriggerWorkflow,
} from "../api/workflow-client";
import type {
  AdminWorkflowDetail,
  AdminWorkflowFilters,
  AdminWorkflowListResponse,
  AdminWorkflowRow,
  WorkflowRunStatus,
} from "../model";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";

type WorkflowFilterFormState = {
  pageSize: number;
  source: string;
  status: "all" | "with_summary" | "pending";
};

const defaultFilters: WorkflowFilterFormState = {
  pageSize: 10,
  source: "",
  status: "all",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const buildQueryFilters = (
  filters: WorkflowFilterFormState,
  page = 1,
): AdminWorkflowFilters => ({
  page,
  page_size: filters.pageSize,
  source: filters.source.trim() || undefined,
  has_summary:
    filters.status === "all"
      ? undefined
      : filters.status === "with_summary"
        ? true
        : false,
});

const SummaryStat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-xl border border-border/60 bg-background/70 p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
  </div>
);

const getStatusBadgeVariant = (status: WorkflowRunStatus): "success" | "secondary" | "danger" | "outline" => {
  if (status === "success") return "success";
  if (status === "running" || status === "queued") return "secondary";
  if (status === "failure") return "danger";
  return "outline";
};

const PaginationButton = ({
  isActive,
  onClick,
  page,
}: {
  isActive: boolean;
  onClick: () => void;
  page: number;
}) => (
  <Button type="button" variant={isActive ? "default" : "outline"} size="sm" onClick={onClick}>
    {page}
  </Button>
);

export const AdminWorkflowManagementCard = () => {
  const { t } = useTranslation("adminWorkflowManagementCard");
  const [data, setData] = useState<AdminWorkflowListResponse | null>(null);
  const [detailData, setDetailData] = useState<AdminWorkflowDetail | null>(null);
  const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkflowFilterFormState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AdminWorkflowFilters>(() => buildQueryFilters(defaultFilters));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const loadWorkflows = useCallback(async (nextFilters: AdminWorkflowFilters) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetchAdminWorkflows(nextFilters);
      setData(response);
      setAppliedFilters(nextFilters);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadWorkflows(buildQueryFilters(defaultFilters));
  }, [loadWorkflows]);

  const summaryItems = useMemo(
    () => [
      { key: "total", label: t("totalRuns"), value: data?.summary.total ?? 0 },
      { key: "with_summary", label: t("withSummary"), value: data?.summary.with_summary ?? 0 },
      { key: "pending", label: t("pendingSummary"), value: data?.summary.pending_summary ?? 0 },
      {
        key: "latest",
        label: t("latestRun"),
        value: data?.summary.latest_run ? formatDateTime(data.summary.latest_run) : "—",
      },
    ],
    [data, t],
  );

  const pageNumbers = useMemo(() => {
    const totalPages = data?.pagination.total_pages ?? 0;
    const currentPage = data?.pagination.page ?? 1;
    if (totalPages <= 1) {
      return [];
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [data?.pagination.page, data?.pagination.total_pages]);

  const resultSummary = data
    ? t("resultSummary", {
        page: data.pagination.page,
        totalPages: data.pagination.total_pages || 1,
        totalItems: data.pagination.total_items,
      })
    : "";

  const handleTriggerRetrieval = async () => {
    setError("");
    setPendingActionId("retrigger");

    try {
      await retriggerWorkflow();
      await loadWorkflows(appliedFilters);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("loadError"));
    } finally {
      setPendingActionId(null);
    }
  };

  const handleInspect = async (workflow: AdminWorkflowRow) => {
    if (expandedWorkflowId === workflow.workflow_task_id) {
      setExpandedWorkflowId(null);
      setDetailData(null);
      return;
    }

    setError("");
    setPendingActionId(workflow.workflow_task_id);

    try {
      const detail = await fetchAdminWorkflows({
        page: 1,
        page_size: 1,
        has_summary: undefined,
        source: undefined,
      });

      if (detail.workflows[0]) {
        const taskDetail = await Promise.resolve(detail.workflows[0]);
        setDetailData(taskDetail as AdminWorkflowDetail);
      }

      setExpandedWorkflowId(workflow.workflow_task_id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("loadError"));
    } finally {
      setPendingActionId(null);
    }
  };

  const handleResummarize = async (workflow: AdminWorkflowRow) => {
    setError("");
    setPendingActionId(workflow.workflow_task_id);

    try {
      await resummarizeWorkflow(workflow.workflow_task_id);
      await loadWorkflows(appliedFilters);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("loadError"));
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCancel = async (workflow: AdminWorkflowRow) => {
    setError("");
    const taskId = workflow.summary_status === "running" || workflow.summary_status === "queued"
      ? workflow.summary_task_id
      : workflow.workflow_task_id;

    if (!taskId) return;

    setPendingActionId(taskId);

    try {
      await cancelWorkflowTask(taskId);
      await loadWorkflows(appliedFilters);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("loadError"));
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleTriggerRetrieval()}
              disabled={isLoading || pendingActionId === "retrigger"}
            >
              <Activity className="size-4" />
              {t("triggerRetrieval")}
            </Button>
            <Button type="button" variant="outline" onClick={() => void loadWorkflows(appliedFilters)} disabled={isLoading}>
              <RefreshCw className="size-4" />
              {t("refresh")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <SummaryStat key={item.key} label={item.label} value={item.value} />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="size-4" />
            {t("statusFilter")}
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-source">{t("sourceFilter")}</Label>
              <Input
                id="workflow-source"
                value={filters.source}
                onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}
                placeholder={t("sourcePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-status">{t("statusFilter")}</Label>
              <select
                id="workflow-status"
                className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as WorkflowFilterFormState["status"],
                  }))
                }
              >
                <option value="all">{t("statusAll")}</option>
                <option value="with_summary">{t("statusWithSummary")}</option>
                <option value="pending">{t("statusPending")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-page-size">{t("pageSize")}</Label>
              <select
                id="workflow-page-size"
                className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={filters.pageSize}
                onChange={(event) => {
                  const nextPageSize = Number(event.target.value);
                  const nextFilters = { ...filters, pageSize: nextPageSize };
                  setFilters(nextFilters);
                  void loadWorkflows(buildQueryFilters(nextFilters, 1));
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {t("pageSizeOption", { count: size })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void loadWorkflows(buildQueryFilters(filters, 1))}>
              {t("applyFilters")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilters(defaultFilters);
                void loadWorkflows(buildQueryFilters(defaultFilters, 1));
              }}
            >
              {t("resetFilters")}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : null}

        {!isLoading && data ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">{resultSummary}</div>
            {data.pagination.total_pages > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadWorkflows({ ...appliedFilters, page: Math.max(1, (data.pagination.page || 1) - 1) })}
                  disabled={data.pagination.page <= 1}
                >
                  {t("previousPage")}
                </Button>
                {pageNumbers.map((page) => (
                  <PaginationButton
                    key={page}
                    page={page}
                    isActive={page === data.pagination.page}
                    onClick={() => void loadWorkflows({ ...appliedFilters, page })}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadWorkflows({ ...appliedFilters, page: data.pagination.page + 1 })}
                  disabled={data.pagination.page >= data.pagination.total_pages}
                >
                  {t("nextPage")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isLoading && data && data.workflows.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-sm text-muted-foreground">
            {t("noWorkflows")}
          </div>
        ) : null}

        {!isLoading &&
          data?.workflows.map((workflow) => {
            const isExpanded = expandedWorkflowId === workflow.workflow_task_id;
            const isPending = pendingActionId === workflow.workflow_task_id;
            const taskIdDisplay = `${workflow.workflow_task_id.slice(0, 8)}…${workflow.workflow_task_id.slice(-4)}`;
            const canCancel =
              (workflow.workflow_status === "running" || workflow.workflow_status === "queued") ||
              (workflow.summary_status === "running" || workflow.summary_status === "queued");

            return (
              <div key={workflow.workflow_task_id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-mono text-sm font-medium" title={workflow.workflow_task_id}>
                        {taskIdDisplay}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.sources.map((source) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                      <Badge variant="secondary">{workflow.article_count} {t("articlesLabel")}</Badge>
                      <Badge variant={getStatusBadgeVariant(workflow.workflow_status)}>
                        {workflow.workflow_status}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(workflow.summary_status)}>
                        {workflow.summary_status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                      <div>{t("providerLabel")}: {workflow.provider || "—"}</div>
                      <div>{t("createdAt")}: {formatDateTime(workflow.created_at)}</div>
                      <div>{t("updatedAt")}: {formatDateTime(workflow.updated_at)}</div>
                    </div>
                    {workflow.summary ? (
                      <div className="line-clamp-2 text-sm text-foreground italic">{workflow.summary}</div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleInspect(workflow)}
                      disabled={isPending}
                    >
                      {t("actionInspect")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleResummarize(workflow)}
                      disabled={isPending}
                    >
                      {t("actionResummarize")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleCancel(workflow)}
                      disabled={!canCancel || isPending}
                    >
                      {t("actionCancel")}
                    </Button>
                  </div>

                  {isExpanded && detailData ? (
                    <div className="mt-4 space-y-4 border-t border-border/40 pt-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t("summaryLabel")}</div>
                        <div className="rounded-lg bg-secondary/20 p-3 text-sm text-foreground whitespace-pre-wrap">
                          {detailData.summary || "—"}
                        </div>
                      </div>
                      {detailData.summary_task_id ? (
                        <div className="text-xs font-mono text-muted-foreground">
                          {t("summaryTaskIdLabel")}: {detailData.summary_task_id}
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t("articlesLabel")}</div>
                        <pre className="max-h-64 overflow-auto rounded-lg bg-secondary/20 p-3 text-xs text-foreground">
                          {JSON.stringify(detailData.articles, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
