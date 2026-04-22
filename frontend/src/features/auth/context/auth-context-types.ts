import type {
  AuthActionResult,
  AuthUser,
  BackendState,
  LoginFormState,
  ProfileUpdatePayload,
  RegisterPayload,
} from "../model";

export type AuthContextValue = {
  backendState: BackendState;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isBootstrapping: boolean;
  isRefreshingProfile: boolean;
  refreshRuntime: () => Promise<void>;
  refreshProfile: () => Promise<AuthActionResult>;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  signIn: (payload: LoginFormState) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<AuthActionResult>;
  user: AuthUser | null;
};
