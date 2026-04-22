import { request } from "../../../shared/api/http.ts";
import { normalizeOptionalText, sanitizeEmail } from "../lib/auth-utils.ts";
import type {
  AuthUser,
  LoginFormState,
  ProfileUpdatePayload,
  ProfileUpdateResponse,
  RegisterPayload,
  RuntimeStatus,
} from "../model";

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

export const loginUser = (payload: LoginFormState) =>
  request<void>("/auth/cookie/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: sanitizeEmail(payload.email),
      password: payload.password,
    }),
    credentials: "include",
  });

export const logoutUser = () =>
  request<void>("/auth/cookie/logout", {
    method: "POST",
    credentials: "include",
  });

export const fetchCurrentUser = () =>
  request<AuthUser>("/users/me", { credentials: "include" });

export const updateCurrentUser = (payload: ProfileUpdatePayload) =>
  request<ProfileUpdateResponse>("/users/me", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: sanitizeEmail(payload.email),
      nickname: normalizeOptionalText(payload.nickname),
    }),
  });
