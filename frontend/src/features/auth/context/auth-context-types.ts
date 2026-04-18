import type {
  AuthActionResult,
  AuthLoginMethod,
  AuthPersistence,
  AuthUser,
  BackendState,
  LoginFormState,
  RegisterPayload,
} from "../model";

export type AuthContextValue = {
  authMethod: AuthLoginMethod | null;
  backendState: BackendState;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isBootstrapping: boolean;
  isRefreshingProfile: boolean;
  persistence: AuthPersistence;
  refreshRuntime: () => Promise<void>;
  refreshProfile: () => Promise<AuthActionResult>;
  register: (payload: RegisterPayload, persistence: AuthPersistence) => Promise<AuthActionResult>;
  setPersistence: (value: AuthPersistence) => void;
  signIn: (
    payload: LoginFormState,
    persistence: AuthPersistence,
    method: AuthLoginMethod,
  ) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  token: string;
  user: AuthUser | null;
};
