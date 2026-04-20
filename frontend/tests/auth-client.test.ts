import assert from "node:assert/strict";
import test from "node:test";

import {
  confirmAccountVerification,
  confirmPasswordReset,
  fetchCurrentUser,
  fetchRuntimeStatus,
  healthcheck,
  loginUser,
  requestPasswordReset,
  requestVerificationEmail,
  registerUser,
} from "../src/features/auth/api/auth-client.ts";

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

test("healthcheck uses the default /api prefix", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ status: "ok" });
  };

  const response = await healthcheck();

  assert.deepEqual(response, { status: "ok" });
  assert.equal(calls.length, 1);
  assert.equal(String(calls[0]?.input), "/api/healthz");
});

test("fetchRuntimeStatus uses the runtime endpoint", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ status: "ok", app_name: "AI News Review" });
  };

  const response = await fetchRuntimeStatus();

  assert.equal(response.status, "ok");
  assert.equal(String(calls[0]?.input), "/api/system/runtime");
});

test("requestPasswordReset posts the forgot-password payload", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(null, { status: 202 });
  };

  await requestPasswordReset(" Person@Example.com ");

  assert.equal(String(calls[0]?.input), "/api/auth/forgot-password");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: "person@example.com",
  });
});

test("requestVerificationEmail posts the verify-token payload", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(null, { status: 202 });
  };

  await requestVerificationEmail(" Person@Example.com ");

  assert.equal(String(calls[0]?.input), "/api/auth/request-verify-token");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: "person@example.com",
  });
});

test("confirmPasswordReset posts token and new password", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse(null);
  };

  await confirmPasswordReset({
    token: "reset-token",
    password: "NewStrongPass456!",
  });

  assert.equal(String(calls[0]?.input), "/api/auth/reset-password");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    token: "reset-token",
    password: "NewStrongPass456!",
  });
});

test("confirmAccountVerification posts the verification token", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "1", email: "verified@example.com" });
  };

  await confirmAccountVerification("verify-token");

  assert.equal(String(calls[0]?.input), "/api/auth/verify");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    token: "verify-token",
  });
});

test("registerUser posts JSON to the register endpoint", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "1", email: "a@example.com" });
  };

  await registerUser({
    email: "a@example.com",
    password: "StrongPass123!",
    username: "reader",
    nickname: "Reader",
  });

  assert.equal(String(calls[0]?.input), "/api/auth/register");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
  assert.match(String(calls[0]?.init?.body), /"email":"a@example.com"/);
});

test("registerUser normalizes optional profile fields before sending", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "1", email: "person@example.com" });
  };

  await registerUser({
    email: " Person@Example.com ",
    password: "StrongPass123!",
    username: "   ",
    nickname: "  ",
  });

  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: "person@example.com",
    password: "StrongPass123!",
    username: null,
    nickname: null,
  });
});

test("loginUser sends form encoded credentials expected by fastapi-users", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ access_token: "token", token_type: "bearer" });
  };

  const response = await loginUser(
    {
      email: "a@example.com",
      password: "StrongPass123!",
    },
    "jwt",
  );

  assert.equal(response?.access_token, "token");
  assert.equal(String(calls[0]?.input), "/api/auth/jwt/login");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>)["Content-Type"],
    "application/x-www-form-urlencoded",
  );
  const body = calls[0]?.init?.body;
  assert.ok(body instanceof URLSearchParams);
  assert.equal(body.get("username"), "a@example.com");
  assert.equal(body.get("password"), "StrongPass123!");
});

test("fetchCurrentUser attaches the bearer token", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "1", email: "a@example.com" });
  };

  await fetchCurrentUser("jwt-token");

  assert.equal(String(calls[0]?.input), "/api/users/me");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer jwt-token",
  );
});
