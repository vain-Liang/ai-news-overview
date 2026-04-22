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
