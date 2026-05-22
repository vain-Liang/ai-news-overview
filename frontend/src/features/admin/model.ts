import type { AuthUser } from "../auth/model";

export type AdminUser = AuthUser & {
  created_at: string;
  updated_at: string;
};

export type AdminUsersSummary = {
  total: number;
  active: number;
  inactive: number;
  superusers: number;
};

export type AdminUsersPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type AdminUserFilters = {
  page?: number;
  page_size?: number;
  search?: string;
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  is_active?: boolean;
};

export type AdminUsersResponse = {
  summary: AdminUsersSummary;
  pagination: AdminUsersPagination;
  users: AdminUser[];
};

export type WorkflowRunStatus = "queued" | "running" | "success" | "failure" | "skipped" | "pending" | "unknown";

export type AdminWorkflowSummary = {
  total: number;
  with_summary: number;
  pending_summary: number;
  latest_run: string | null;
};

export type AdminWorkflowPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type AdminWorkflowRow = {
  workflow_task_id: string;
  summary_task_id: string | null;
  provider: string;
  sources: string[];
  article_count: number;
  summary: string;
  summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
  workflow_status: WorkflowRunStatus;
  summary_status: WorkflowRunStatus;
};

export type AdminWorkflowDetail = AdminWorkflowRow & {
  articles: Array<Record<string, unknown>>;
};

export type AdminWorkflowListResponse = {
  summary: AdminWorkflowSummary;
  pagination: AdminWorkflowPagination;
  workflows: AdminWorkflowRow[];
};

export type AdminWorkflowActionResponse = {
  task_id: string;
  status: WorkflowRunStatus | string;
  message?: string | null;
};

export type AdminWorkflowCancelResponse = {
  task_id: string;
  status: WorkflowRunStatus | string;
  cancelled: boolean;
  message?: string | null;
};

export type AdminWorkflowFilters = {
  page?: number;
  page_size?: number;
  has_summary?: boolean;
  source?: string;
};
