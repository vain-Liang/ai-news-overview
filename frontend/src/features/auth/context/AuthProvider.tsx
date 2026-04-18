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
} from "../api/auth-client";
import {
  clearAuthToken,
  readAuthState,
  writeAuthToken,
} from "../lib/auth-storage";
import type {
  AuthActionResult,
  AuthLoginMethod,
  AuthPersistence,
  AuthUser,
  BackendState,
  LoginFormState,
  RegisterPayload,
} from "../model";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./auth-context-types";

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const initialState = useMemo(() => readAuthState(), []);
  const [token, setToken] = useState(initialState.token);
  const [authMethod, setAuthMethod] = useState<AuthLoginMethod | null>(
    initialState.token ? "jwt" : null,
  );
  const [persistence, setPersistence] = useState<AuthPersistence>(
    initialState.persistence,
  );
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
    clearAuthToken();
    setToken("");
    setAuthMethod(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(
    async (nextToken?: string) => {
      setIsRefreshingProfile(true);
      try {
        const nextUser = await fetchCurrentUser(nextToken);
        setToken(nextToken ?? "");
        setAuthMethod(nextToken ? "jwt" : "cookie");
        setUser(nextUser);
        return { ok: true } as AuthActionResult;
      } catch {
        if (nextToken) {
          clearAuthToken();
        }
        setToken("");
        setAuthMethod(null);
        setUser(null);
        return {
          ok: false,
          message: t("backend.restoredSessionExpired"),
        } as AuthActionResult;
      } finally {
        setIsRefreshingProfile(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedToken = initialState.token;
      let result = storedToken
        ? await restoreSession(storedToken)
        : await restoreSession();

      if (!result.ok && storedToken) {
        result = await restoreSession();
      }

      if (!result.ok) {
        clearSession();
      }

      setIsBootstrapping(false);
    };

    void bootstrapSession();
  }, [clearSession, initialState.token, restoreSession]);

  const signIn = useCallback(
    async (
      payload: LoginFormState,
      nextPersistence: AuthPersistence,
      method: AuthLoginMethod,
    ) => {
      setIsAuthenticating(true);
      try {
        const response = await loginUser(payload, method);
        setPersistence(nextPersistence);

        if (method === "jwt") {
          const accessToken = response?.access_token;

          if (!accessToken) {
            return {
              ok: false,
              message: t("auth.jwtLoginTokenMissing"),
            } satisfies AuthActionResult;
          }

          writeAuthToken(accessToken, nextPersistence);
          const result = await restoreSession(accessToken);
          return result.ok
            ? ({ ok: true } satisfies AuthActionResult)
            : result;
        }

        clearAuthToken();
        setToken("");
        const result = await restoreSession();
        return result.ok
          ? ({ ok: true } satisfies AuthActionResult)
          : result;
      } catch (error) {
        return {
          ok: false,
          message: toMessage(error, t("backend.offline")),
        } satisfies AuthActionResult;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [restoreSession, t],
  );

  const register = useCallback(
    async (payload: RegisterPayload, nextPersistence: AuthPersistence) => {
      setIsAuthenticating(true);
      try {
        await registerUser(payload);
        const loginResult = await signIn(
          { email: payload.email, password: payload.password },
          nextPersistence,
          "jwt",
        );
        return loginResult.ok
          ? ({ ok: true } satisfies AuthActionResult)
          : loginResult;
      } catch (error) {
        return {
          ok: false,
          message: toMessage(error, t("backend.offline")),
        } satisfies AuthActionResult;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [signIn, t],
  );

  const refreshProfile = useCallback(async () => {
    if (!token && authMethod !== "cookie") {
      return { ok: false, message: t("home.notSignedIn") } satisfies AuthActionResult;
    }

    return restoreSession(token || undefined);
  }, [authMethod, restoreSession, t, token]);

  const signOut = useCallback(async () => {
    const logoutTasks: Array<Promise<void>> = [];

    if (token) {
      logoutTasks.push(logoutUser("jwt", token));
    }

    logoutTasks.push(logoutUser("cookie"));

    await Promise.allSettled(logoutTasks);
    clearSession();
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authMethod,
      backendState,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      isBootstrapping,
      isRefreshingProfile,
      persistence,
      refreshRuntime,
      refreshProfile,
      register,
      setPersistence,
      signIn,
      signOut,
      token,
      user,
    }),
    [
      authMethod,
      backendState,
      isAuthenticating,
      isBootstrapping,
      isRefreshingProfile,
      persistence,
      refreshProfile,
      refreshRuntime,
      register,
      signIn,
      signOut,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
