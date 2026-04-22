import { requestAdmin } from "../../../shared/api/http.ts";
import type { AdminUser, AdminUserFilters, AdminUsersResponse } from "../model";

const buildAdminUsersQuery = (filters: AdminUserFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }
  if (filters.page_size) {
    params.set("page_size", String(filters.page_size));
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.created_from) {
    params.set("created_from", filters.created_from);
  }
  if (filters.created_to) {
    params.set("created_to", filters.created_to);
  }
  if (filters.updated_from) {
    params.set("updated_from", filters.updated_from);
  }
  if (filters.updated_to) {
    params.set("updated_to", filters.updated_to);
  }
  if (typeof filters.is_active === "boolean") {
    params.set("is_active", String(filters.is_active));
  }

  const queryString = params.toString();
  return queryString ? `/users?${queryString}` : "/users";
};

export const fetchAdminUsers = (filters?: AdminUserFilters) =>
  requestAdmin<AdminUsersResponse>(buildAdminUsersQuery(filters));

export const updateAdminUserStatus = (userId: string, isActive: boolean) =>
  requestAdmin<AdminUser>(`/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active: isActive }),
  });
