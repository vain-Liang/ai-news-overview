import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useTranslation } from "react-i18next";

import {
  fetchCurrentUser,
  fetchRuntimeStatus,
  healthcheck,
  loginUser,
  logoutUser,
  registerUser,
  updateCurrentUser,
} from "../api/auth-client";
import { clearAuthToken } from "../lib/auth-storage";
import type {
  AuthActionResult,
  AuthUser,
  BackendState,
  LoginFormState,
  ProfileUpdatePayload,
  RegisterPayload,
} from "../model";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./auth-context-types";

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [backendState, setBackendState] = useState<BackendState>({
    kind: "checking",
    message: t("backend.checking"),
    runtime: null,
  });

  const refreshRuntime = useCallback(async () => {
    try {
      const runtime = await fetchRuntimeStatus();
      setBackendState({
        kind: "online",
        message: t("backend.online"),
        runtime,
      });
      return;
    } catch {
      try {
        const fallback = await healthcheck();
        setBackendState({
          kind: fallback.status === "ok" ? "online" : "checking",
          message: t("backend.online"),
          runtime: null,
        });
      } catch (error) {
        setBackendState({
          kind: "offline",
          message: toMessage(error, t("backend.offline")),
          runtime: null,
        });
      }
    }
  }, [t]);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const restoreSession = useCallback(async (): Promise<AuthActionResult> => {
    setIsRefreshingProfile(true);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      return { ok: true };
    } catch {
      setUser(null);
      return { ok: false, message: t("backend.restoredSessionExpired") };
    } finally {
      setIsRefreshingProfile(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);

  useEffect(() => {
    // Clear any legacy JWT tokens stored from the previous bearer auth method
    clearAuthToken();

    const bootstrapSession = async () => {
      await restoreSession();
      setIsBootstrapping(false);
    };

    void bootstrapSession();
  }, [restoreSession]);

  const signIn = useCallback(
    async (payload: LoginFormState): Promise<AuthActionResult> => {
      setIsAuthenticating(true);
      try {
        await loginUser(payload);
        return await restoreSession();
      } catch (error) {
        return {
          ok: false,
          message: toMessage(error, t("backend.offline")),
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [restoreSession, t],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthActionResult> => {
      setIsAuthenticating(true);
      try {
        await registerUser(payload);
        return await signIn({ email: payload.email, password: payload.password });
      } catch (error) {
        return {
          ok: false,
          message: toMessage(error, t("backend.offline")),
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [signIn, t],
  );

  const refreshProfile = useCallback(async (): Promise<AuthActionResult> => {
    if (!user) {
      return { ok: false, message: t("home.notSignedIn") };
    }
    return restoreSession();
  }, [restoreSession, t, user]);

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload): Promise<AuthActionResult> => {
      if (!user) {
        return { ok: false, message: t("home.notSignedIn") };
      }

      setIsRefreshingProfile(true);
      try {
        const response = await updateCurrentUser(payload);
        setUser(response.user);

        if (response.email_change_requested && response.user.pending_email) {
          return {
            ok: true,
            message: t("profile.emailChangeVerificationSent", {
              email: response.user.pending_email,
            }),
          };
        }

        return { ok: true, message: t("profile.updateSuccess") };
      } catch (error) {
        return {
          ok: false,
          message: toMessage(error, t("backend.offline")),
        };
      } finally {
        setIsRefreshingProfile(false);
      }
    },
    [t, user],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // best-effort logout
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      backendState,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      isBootstrapping,
      isRefreshingProfile,
      refreshRuntime,
      refreshProfile,
      register,
      signIn,
      signOut,
      updateProfile,
      user,
    }),
    [
      backendState,
      isAuthenticating,
      isBootstrapping,
      isRefreshingProfile,
      refreshProfile,
      refreshRuntime,
      register,
      signIn,
      signOut,
      updateProfile,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
