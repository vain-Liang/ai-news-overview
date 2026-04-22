import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchCurrentUser,
  registerUser,
  updateCurrentUser,
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

test("auth client uses bearer token when fetching the current user", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ id: "user-1", email: "demo@example.com", pending_email: null });
  };

  await fetchCurrentUser("demo-token");

  assert.equal(String(calls[0]?.input), "/api/users/me");
  assert.equal((calls[0]?.init?.headers as Record<string, string>).Authorization, "Bearer demo-token");
  assert.equal(calls[0]?.init?.credentials, undefined);
});

test("auth client updates the current user with normalized fields", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      user: { id: "user-1", email: "current@example.com", nickname: "Display Name", pending_email: "next@example.com" },
      email_change_requested: true,
    });
  };

  await updateCurrentUser({ email: "  NEXT@EXAMPLE.COM ", nickname: "  Display Name  " }, "demo-token");

  assert.equal(String(calls[0]?.input), "/api/users/me");
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.equal((calls[0]?.init?.headers as Record<string, string>).Authorization, "Bearer demo-token");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: "next@example.com",
    nickname: "Display Name",
  });
});

test("auth client translates backend password policy errors", async () => {
  globalThis.fetch = async () =>
    createJsonResponse(
      {
        error: {
          code: "HTTP_ERROR",
          message: "Password is too weak",
        },
      },
      { status: 400 },
    );

  await assert.rejects(
    () =>
      registerUser({
        email: "reader@example.com",
        password: "weak",
        username: "reader",
        nickname: "",
      }),
    {
      message: "Choose a stronger password that is harder to guess.",
    },
  );
});

test("auth client translates backend duplicate-user errors", async () => {
  globalThis.fetch = async () =>
    createJsonResponse(
      {
        error: {
          code: "HTTP_ERROR",
          message: "REGISTER_USER_ALREADY_EXISTS",
        },
      },
      { status: 400 },
    );

  await assert.rejects(
    () =>
      registerUser({
        email: "reader@example.com",
        password: "StrongPass123!",
        username: "reader",
        nickname: "",
      }),
    {
      message: "An account with this email address or username already exists.",
    },
  );
});
