import assert from "node:assert/strict";
import test from "node:test";

import { fetchAdminUsers, updateAdminUserStatus } from "../src/features/admin/api/admin-client.ts";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const runtimeEnv = globalThis as typeof globalThis & {
  __APP_ENV__?: {
    VITE_ADMIN_API_PREFIX?: string;
  };
};

test("admin client uses the default /admin prefix", async () => {
  const calls: FetchCall[] = [];
  const originalEnv = runtimeEnv.__APP_ENV__;
  runtimeEnv.__APP_ENV__ = { ...originalEnv, VITE_ADMIN_API_PREFIX: undefined };

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      summary: { total: 0, active: 0, inactive: 0, superusers: 0 },
      pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
      users: [],
    });
  };

  try {
    await fetchAdminUsers();
  } finally {
    runtimeEnv.__APP_ENV__ = originalEnv;
  }

  assert.equal(String(calls[0]?.input), "/api/admin/users");
});

test("admin client serializes pagination and filters", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      summary: { total: 1, active: 1, inactive: 0, superusers: 0 },
      pagination: { page: 2, page_size: 20, total_items: 1, total_pages: 1 },
      users: [],
    });
  };

  await fetchAdminUsers({
    page: 2,
    page_size: 20,
    search: "gamma",
    created_from: "2026-04-01T00:00:00.000Z",
    created_to: "2026-04-30T00:00:00.000Z",
    updated_from: "2026-04-05T00:00:00.000Z",
    updated_to: "2026-04-21T00:00:00.000Z",
    is_active: true,
  });

  assert.equal(
    String(calls[0]?.input),
    "/api/admin/users?page=2&page_size=20&search=gamma&created_from=2026-04-01T00%3A00%3A00.000Z&created_to=2026-04-30T00%3A00%3A00.000Z&updated_from=2026-04-05T00%3A00%3A00.000Z&updated_to=2026-04-21T00%3A00%3A00.000Z&is_active=true",
  );
});

test("admin client respects a custom admin prefix", async () => {
  const calls: FetchCall[] = [];
  const originalEnv = runtimeEnv.__APP_ENV__;
  runtimeEnv.__APP_ENV__ = { ...originalEnv, VITE_ADMIN_API_PREFIX: "/backoffice/" };

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "user-1", is_active: true });
  };

  try {
    await updateAdminUserStatus("user-1", true);
  } finally {
    runtimeEnv.__APP_ENV__ = originalEnv;
  }

  assert.equal(String(calls[0]?.input), "/api/backoffice/users/user-1");
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { is_active: true });
});
