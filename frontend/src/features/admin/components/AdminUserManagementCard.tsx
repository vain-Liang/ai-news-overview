import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchAdminUsers, updateAdminUserStatus } from "../api/admin-client";
import type { AdminUser, AdminUserFilters, AdminUsersResponse } from "../model";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Switch } from "../../../shared/ui/switch";

type AdminFilterFormState = {
  pageSize: number;
  search: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  status: "all" | "active" | "inactive";
};

const defaultFilters: AdminFilterFormState = {
  pageSize: 10,
  search: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  status: "all",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const buildQueryFilters = (
  filters: AdminFilterFormState,
  page = 1,
): AdminUserFilters => ({
  page,
  page_size: filters.pageSize,
  search: filters.search.trim() || undefined,
  created_from: filters.createdFrom ? new Date(filters.createdFrom).toISOString() : undefined,
  created_to: filters.createdTo ? new Date(filters.createdTo).toISOString() : undefined,
  updated_from: filters.updatedFrom ? new Date(filters.updatedFrom).toISOString() : undefined,
  updated_to: filters.updatedTo ? new Date(filters.updatedTo).toISOString() : undefined,
  is_active:
    filters.status === "all"
      ? undefined
      : filters.status === "active",
});

const SummaryStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-border/60 bg-background/70 p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
  </div>
);

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

export const AdminUserManagementCard = ({ currentUserId }: { currentUserId: string }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [filters, setFilters] = useState<AdminFilterFormState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AdminUserFilters>(() => buildQueryFilters(defaultFilters));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async (nextFilters: AdminUserFilters) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetchAdminUsers(nextFilters);
      setData(response);
      setAppliedFilters(nextFilters);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("admin.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadUsers(buildQueryFilters(defaultFilters));
  }, [loadUsers]);

  const summaryItems = useMemo(
    () => [
      { key: "total", label: t("admin.totalUsers"), value: data?.summary.total ?? 0 },
      { key: "active", label: t("admin.activeUsers"), value: data?.summary.active ?? 0 },
      { key: "inactive", label: t("admin.inactiveUsers"), value: data?.summary.inactive ?? 0 },
      { key: "superusers", label: t("admin.superusers"), value: data?.summary.superusers ?? 0 },
    ],
    [data, t],
  );

  const handleToggleAccount = async (account: AdminUser) => {
    setError("");
    setPendingUserId(account.id);

    try {
      await updateAdminUserStatus(account.id, !account.is_active);
      await loadUsers(appliedFilters);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : t("admin.loadError"));
    } finally {
      setPendingUserId(null);
    }
  };

  const handleSearch = async () => {
    await loadUsers(buildQueryFilters(filters, 1));
  };

  const handleResetFilters = async () => {
    setFilters(defaultFilters);
    await loadUsers(buildQueryFilters(defaultFilters, 1));
  };

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
    ? t("admin.resultSummary", {
        page: data.pagination.page,
        totalPages: data.pagination.total_pages || 1,
        totalItems: data.pagination.total_items,
      })
    : "";

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("admin.manageUsers")}</CardTitle>
            <CardDescription>{t("admin.manageUsersDescription")}</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadUsers(appliedFilters)} disabled={isLoading}>
            <RefreshCw className="size-4" />
            {t("admin.refreshUsers")}
          </Button>
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
            {t("admin.filtersTitle")}
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="admin-search">{t("admin.searchLabel")}</Label>
              <Input
                id="admin-search"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder={t("admin.searchPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-status">{t("admin.statusFilter")}</Label>
              <select
                id="admin-status"
                className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as AdminFilterFormState["status"],
                  }))
                }
              >
                <option value="all">{t("admin.statusAll")}</option>
                <option value="active">{t("admin.statusActive")}</option>
                <option value="inactive">{t("admin.statusInactive")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-page-size">{t("admin.pageSize")}</Label>
              <select
                id="admin-page-size"
                className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={filters.pageSize}
                onChange={(event) => {
                  const nextPageSize = Number(event.target.value);
                  const nextFilters = { ...filters, pageSize: nextPageSize };
                  setFilters(nextFilters);
                  void loadUsers(buildQueryFilters(nextFilters, 1));
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {t("admin.pageSizeOption", { count: size })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-created-from">{t("admin.createdFrom")}</Label>
              <Input
                id="admin-created-from"
                type="datetime-local"
                value={filters.createdFrom}
                onChange={(event) => setFilters((current) => ({ ...current, createdFrom: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-created-to">{t("admin.createdTo")}</Label>
              <Input
                id="admin-created-to"
                type="datetime-local"
                value={filters.createdTo}
                onChange={(event) => setFilters((current) => ({ ...current, createdTo: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-updated-from">{t("admin.updatedFrom")}</Label>
              <Input
                id="admin-updated-from"
                type="datetime-local"
                value={filters.updatedFrom}
                onChange={(event) => setFilters((current) => ({ ...current, updatedFrom: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-updated-to">{t("admin.updatedTo")}</Label>
              <Input
                id="admin-updated-to"
                type="datetime-local"
                value={filters.updatedTo}
                onChange={(event) => setFilters((current) => ({ ...current, updatedTo: event.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handleSearch()}>
              {t("admin.applyFilters")}
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleResetFilters()}>
              {t("admin.resetFilters")}
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
            {t("admin.loadingUsers")}
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
                  onClick={() => void loadUsers({ ...appliedFilters, page: Math.max(1, (data.pagination.page || 1) - 1) })}
                  disabled={data.pagination.page <= 1}
                >
                  {t("admin.previousPage")}
                </Button>
                {pageNumbers.map((page) => (
                  <PaginationButton
                    key={page}
                    page={page}
                    isActive={page === data.pagination.page}
                    onClick={() => void loadUsers({ ...appliedFilters, page })}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadUsers({ ...appliedFilters, page: data.pagination.page + 1 })}
                  disabled={data.pagination.page >= data.pagination.total_pages}
                >
                  {t("admin.nextPage")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isLoading && data && data.users.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-sm text-muted-foreground">
            {t("admin.noUsers")}
          </div>
        ) : null}

        {!isLoading && data?.users.map((account) => {
          const isCurrentUser = account.id === currentUserId;
          const isPending = pendingUserId === account.id;

          return (
            <div key={account.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold">{account.nickname || account.username || account.email}</div>
                    <Badge variant={account.is_active ? "success" : "danger"}>
                      <UserRound className="size-3.5" />
                      {account.is_active ? t("admin.accountActive") : t("admin.accountDisabled")}
                    </Badge>
                    {account.is_superuser ? (
                      <Badge variant="outline">
                        <ShieldCheck className="size-3.5" />
                        {t("admin.superuserBadge")}
                      </Badge>
                    ) : null}
                    {isCurrentUser ? <Badge variant="secondary">{t("admin.you")}</Badge> : null}
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                    <div>{t("home.email")}: {account.email}</div>
                    <div>{t("home.username")}: {account.username || "—"}</div>
                    <div>{t("home.nickname")}: {account.nickname || "—"}</div>
                    <div>{t("admin.updatedAt")}: {formatDateTime(account.updated_at)}</div>
                    <div>{t("admin.createdAt")}: {formatDateTime(account.created_at)}</div>
                  </div>
                </div>

                <div className="flex min-w-72 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Users className="size-4" />
                      {t("admin.accountStatus")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isCurrentUser ? t("admin.cannotDisableSelf") : t("admin.accountStatusDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={account.is_active}
                    onCheckedChange={() => void handleToggleAccount(account)}
                    disabled={isCurrentUser || isPending}
                    aria-label={t("admin.accountStatus")}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
