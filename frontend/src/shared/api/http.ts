import i18n from "../i18n/config.ts";

type RuntimeEnv = {
  VITE_API_BASE_URL?: string;
  VITE_ADMIN_API_PREFIX?: string;
};

type ImportMetaEnvLike = ImportMeta & {
  env?: RuntimeEnv;
};

type GlobalWithAppEnv = typeof globalThis & {
  __APP_ENV__?: RuntimeEnv;
};

type ErrorPayload = {
  detail?:
    | string
    | { reason?: string; code?: string; message?: string }
    | Array<{ msg?: string }>;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ loc?: Array<string | number>; msg?: string; type?: string }>;
  };
};

const readRuntimeEnv = (): RuntimeEnv => {
  const meta = import.meta as ImportMetaEnvLike;
  const globalEnv = (globalThis as GlobalWithAppEnv).__APP_ENV__;

  return {
    VITE_API_BASE_URL: globalEnv?.VITE_API_BASE_URL ?? meta.env?.VITE_API_BASE_URL,
    VITE_ADMIN_API_PREFIX: globalEnv?.VITE_ADMIN_API_PREFIX ?? meta.env?.VITE_ADMIN_API_PREFIX,
  };
};

const resolveApiBaseUrl = () =>
  readRuntimeEnv().VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

const normalizePathPrefix = (value: string | undefined, fallback: string) => {
  const rawValue = value?.trim() || fallback;
  const segments = rawValue.split("/").filter(Boolean);
  return segments.length > 0 ? `/${segments.join("/")}` : fallback;
};

const resolveAdminApiPrefix = () =>
  normalizePathPrefix(readRuntimeEnv().VITE_ADMIN_API_PREFIX, "/admin");

const buildUrl = (path: string, prefix = "") => `${resolveApiBaseUrl()}${prefix}${path}`;

const includesText = (value: string | null | undefined, pattern: string) =>
  Boolean(value && value.includes(pattern));

const translateKnownBackendMessage = (message: string | null | undefined) => {
  if (!message) {
    return null;
  }

  if (includesText(message, "Password should be at least 8 characters")) {
    return i18n.t("validationPasswordLength", { ns: "http" });
  }
  if (includesText(message, "Password should not contain e-mail")) {
    return i18n.t("validationPasswordEmail", { ns: "http" });
  }
  if (
    includesText(
      message,
      "Password must include uppercase, lowercase, and special characters",
    ) ||
    includesText(
      message,
      "Password must include at least 3 of: lowercase, uppercase, numbers, symbols",
    )
  ) {
    return i18n.t("validationPasswordCaseSymbol", { ns: "http" });
  }
  if (includesText(message, "Password is too weak")) {
    return i18n.t("passwordTooWeak", { ns: "http" });
  }
  if (includesText(message, "REGISTER_USER_ALREADY_EXISTS")) {
    return i18n.t("registerUserAlreadyExists", { ns: "http" });
  }
  if (includesText(message, "LOGIN_BAD_CREDENTIALS")) {
    return i18n.t("loginBadCredentials", { ns: "http" });
  }
  if (includesText(message, "VERIFY_USER_BAD_TOKEN")) {
    return i18n.t("verifyUserBadToken", { ns: "http" });
  }
  if (includesText(message, "VERIFY_USER_ALREADY_VERIFIED")) {
    return i18n.t("verifyUserAlreadyVerified", { ns: "http" });
  }
  if (includesText(message, "RESET_PASSWORD_BAD_TOKEN")) {
    return i18n.t("resetPasswordBadToken", { ns: "http" });
  }
  if (includesText(message, "RESET_PASSWORD_INVALID_PASSWORD")) {
    return i18n.t("resetPasswordInvalidPassword", { ns: "http" });
  }
  if (
    includesText(message, "A user with this email already exists.") ||
    includesText(message, "The requested email address is already in use.")
  ) {
    return i18n.t("emailAlreadyInUse", { ns: "http" });
  }
  if (includesText(message, "Inactive users cannot change their email.")) {
    return i18n.t("inactiveUserEmailChange", { ns: "http" });
  }
  if (includesText(message, "Superusers cannot disable their own account.")) {
    return i18n.t("adminCannotDisableSelf", { ns: "http" });
  }
  if (includesText(message, "created_from cannot be later than created_to.")) {
    return i18n.t("invalidCreatedRange", { ns: "http" });
  }
  if (includesText(message, "updated_from cannot be later than updated_to.")) {
    return i18n.t("invalidUpdatedRange", { ns: "http" });
  }

  return null;
};

const translateValidationDetails = (payload: ErrorPayload) => {
  const firstDetailMessage = payload.error?.details?.[0]?.msg ?? null;
  return (
    translateKnownBackendMessage(firstDetailMessage) ||
    i18n.t("validationFailed", { ns: "http" })
  );
};

const translateErrorPayload = (
  response: Response,
  payload: ErrorPayload,
) => {
  const candidates = [
    payload.error?.message,
    typeof payload.detail === "string" ? payload.detail : null,
    Array.isArray(payload.detail) ? payload.detail[0]?.msg ?? null : null,
    payload.detail &&
    typeof payload.detail === "object" &&
    !Array.isArray(payload.detail)
      ? payload.detail.message || payload.detail.reason || payload.detail.code || null
      : null,
  ];

  for (const candidate of candidates) {
    const translatedMessage = translateKnownBackendMessage(candidate);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  if (payload.error?.code === "VALIDATION_ERROR") {
    return translateValidationDetails(payload);
  }

  if (payload.error?.code === "INTERNAL_ERROR" || response.status >= 500) {
    return i18n.t("internal", { ns: "http" });
  }

  if (response.status === 401 || response.status === 403) {
    return i18n.t("unauthorized", { ns: "http" });
  }

  if (response.status === 404) {
    return i18n.t("notFound", { ns: "http" });
  }

  return i18n.t("generic", { ns: "http" });
};

const getErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return translateErrorPayload(response, payload);
  } catch {
    // Ignore parsing errors and fall back to status text.
  }

  return response.statusText
    ? i18n.t("genericWithStatus", { ns: "http", status: response.statusText })
    : i18n.t("generic", { ns: "http" });
};

const requestWithPrefix = async <T>(
  prefix: string,
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(buildUrl(path, prefix), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const request = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => requestWithPrefix("", path, init);

export const requestAdmin = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => requestWithPrefix(resolveAdminApiPrefix(), path, init);
