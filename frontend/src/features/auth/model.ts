export type AuthUser = {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  username: string | null;
  nickname: string | null;
};

export type RuntimeStatus = {
  status: string;
  app_name: string;
  debug: boolean;
  server_time: string;
  auth: {
    register_path: string;
    login_path: string;
    forgot_password_path: string;
    reset_password_path: string;
    request_verify_path: string;
    verify_path: string;
    me_path: string;
  };
};

export type BackendState = {
  kind: "checking" | "online" | "offline";
  message: string;
  runtime: RuntimeStatus | null;
};

export type LoginFormState = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  username: string;
  nickname: string;
};

export type RegisterFormState = RegisterPayload & {
  confirmPassword: string;
};

export type RegisterFieldErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

export type AuthPersistence = "local" | "session";
export type AuthLoginMethod = "jwt" | "cookie";

export type StoredAuthState = {
  token: string;
  persistence: AuthPersistence;
};

export type AuthActionResult =
  | { ok: true }
  | { ok: false; message: string };

export const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
};

export const initialRegisterForm: RegisterFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  username: "",
  nickname: "",
};
