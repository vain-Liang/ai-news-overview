import { requestAdmin } from "../../../shared/api/http.ts";
import type {
  AdminWorkflowActionResponse,
  AdminWorkflowCancelResponse,
  AdminWorkflowDetail,
  AdminWorkflowFilters,
  AdminWorkflowListResponse,
} from "../model";

const buildWorkflowQuery = (filters: AdminWorkflowFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }
  if (filters.page_size) {
    params.set("page_size", String(filters.page_size));
  }
  if (typeof filters.has_summary === "boolean") {
    params.set("has_summary", String(filters.has_summary));
  }
  if (filters.source?.trim()) {
    params.set("source", filters.source.trim());
  }

  const queryString = params.toString();
  return queryString ? `/workflows?${queryString}` : "/workflows";
};

export const fetchAdminWorkflows = (filters?: AdminWorkflowFilters) =>
  requestAdmin<AdminWorkflowListResponse>(buildWorkflowQuery(filters));

export const fetchAdminWorkflowDetail = (taskId: string) =>
  requestAdmin<AdminWorkflowDetail>(`/workflows/${taskId}`);

export const retriggerWorkflow = (sources?: string[] | null) =>
  requestAdmin<AdminWorkflowActionResponse>("/workflows/retrigger", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sources: sources || null }),
  });

export const resummarizeWorkflow = (taskId: string, provider?: string | null) =>
  requestAdmin<AdminWorkflowActionResponse>(`/workflows/${taskId}/resummarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider: provider || null }),
  });

export const cancelWorkflowTask = (taskId: string) =>
  requestAdmin<AdminWorkflowCancelResponse>(`/workflows/${taskId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
