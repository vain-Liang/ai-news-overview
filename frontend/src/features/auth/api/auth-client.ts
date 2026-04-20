import { request } from "../../../shared/api/http.ts";
import { normalizeOptionalText, sanitizeEmail } from "../lib/auth-utils.ts";
import type {
  AuthLoginMethod,
  AuthUser,
  LoginFormState,
  RegisterPayload,
  RuntimeStatus,
} from "../model";

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
};

export const healthcheck = () => request<{ status: string }>("/healthz");

export const fetchRuntimeStatus = () =>
  request<RuntimeStatus>("/system/runtime");

export const requestPasswordReset = (email: string) =>
  request<void>("/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: sanitizeEmail(email),
    }),
  });

export const requestVerificationEmail = (email: string) =>
  request<void>("/auth/request-verify-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: sanitizeEmail(email),
    }),
  });

export const confirmPasswordReset = (payload: {
  token: string;
  password: string;
}) =>
  request<void>("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const confirmAccountVerification = (token: string) =>
  request<AuthUser>("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

export const registerUser = (payload: RegisterPayload) =>
  request<AuthUser>("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      email: sanitizeEmail(payload.email),
      username: normalizeOptionalText(payload.username),
      nickname: normalizeOptionalText(payload.nickname),
    }),
  });

const buildLoginBody = (payload: LoginFormState) =>
  new URLSearchParams({
    username: sanitizeEmail(payload.email),
    password: payload.password,
  });

export const loginUser = async (
  payload: LoginFormState,
  method: AuthLoginMethod,
) => {
  const path =
    method === "cookie" ? "/auth/cookie/login" : "/auth/jwt/login";

  const response = await request<LoginResponse | undefined>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildLoginBody(payload),
    credentials: method === "cookie" ? "include" : undefined,
  });

  return response;
};

export const logoutUser = async (method: AuthLoginMethod, token?: string) => {
  const path =
    method === "cookie" ? "/auth/cookie/logout" : "/auth/jwt/logout";

  return request<void>(path, {
    method: "POST",
    credentials: method === "cookie" ? "include" : undefined,
    headers:
      method === "jwt" && token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
  });
};

export const fetchCurrentUser = (token?: string) =>
  request<AuthUser>("/users/me", {
    credentials: token ? undefined : "include",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
