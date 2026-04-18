import i18n from "../../../shared/i18n/config.ts";
import type {
  AuthLoginMethod,
  AuthPersistence,
  AuthUser,
  LoginFormState,
  RegisterFieldErrors,
  RegisterFormState,
} from "../model";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sanitizeEmail = (value: string) => value.trim().toLowerCase();

export const normalizeOptionalText = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

export const getSessionLabel = (user: AuthUser | null) =>
  user?.nickname || user?.username || user?.email || i18n.t("home.notSignedIn");

export const isLoginFormComplete = (form: LoginFormState) =>
  Boolean(sanitizeEmail(form.email) && form.password);

export const getRegisterFieldErrors = (
  form: RegisterFormState,
): RegisterFieldErrors => {
  const email = sanitizeEmail(form.email);
  const errors: RegisterFieldErrors = {};

  if (!email) {
    errors.email = i18n.t("validation.emailRequired");
  } else if (!emailPattern.test(email)) {
    errors.email = i18n.t("validation.emailInvalid");
  }

  if (!form.password) {
    errors.password = i18n.t("validation.passwordRequired");
  } else if (form.password.length < 8) {
    errors.password = i18n.t("validation.passwordLength");
  } else if (email && form.password.toLowerCase().includes(email)) {
    errors.password = i18n.t("validation.passwordEmail");
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = i18n.t("validation.confirmRequired");
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = i18n.t("validation.confirmMismatch");
  }

  return errors;
};

export const getRegisterValidationMessage = (form: RegisterFormState) => {
  const fieldErrors = getRegisterFieldErrors(form);
  return (
    fieldErrors.email ||
    fieldErrors.password ||
    fieldErrors.confirmPassword ||
    null
  );
};

export const getPersistenceCopy = (persistence: AuthPersistence) =>
  persistence === "local"
    ? {
        label: i18n.t("home.sessionRemembered"),
        description: i18n.t("home.sessionRememberedDesc"),
      }
    : {
        label: i18n.t("home.sessionTemporary"),
        description: i18n.t("home.sessionTemporaryDesc"),
      };

export const getLoginMethodCopy = (method: AuthLoginMethod) =>
  method === "jwt"
    ? {
        label: i18n.t("auth.loginWithJwt"),
        description: i18n.t("auth.loginWithJwtDescription"),
      }
    : {
        label: i18n.t("auth.loginWithCookie"),
        description: i18n.t("auth.loginWithCookieDescription"),
      };
