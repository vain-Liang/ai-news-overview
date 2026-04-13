import { useEffect, useMemo, useState } from 'react'

import { fetchCurrentUser, healthcheck, loginUser, registerUser } from '../api/auth-client'
import { clearAuthToken, readAuthToken, writeAuthToken } from '../lib/auth-storage'
import { getSessionLabel } from '../lib/auth-utils'
import {
  initialLoginForm,
  initialRegisterForm,
  type AuthUser,
  type BackendState,
  type LoginFormState,
  type RegisterFormState,
  type StatusState,
} from '../model'

const toMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

export const useAuth = () => {
  const [token, setToken] = useState(() => readAuthToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm)
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm)
  const [backendState, setBackendState] = useState<BackendState>({
    kind: 'checking',
    message: 'Checking backend connectivity…',
  })
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRefreshingUser, setIsRefreshingUser] = useState(false)

  const isAuthenticated = Boolean(token && user)
  const sessionLabel = useMemo(() => getSessionLabel(user), [user])

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await healthcheck()
        setBackendState({ kind: 'online', message: `Backend is online (${response.status}).` })
      } catch (error) {
        setBackendState({ kind: 'offline', message: toMessage(error, 'Unable to reach the backend.') })
      }
    }

    void checkBackend()
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    const loadUser = async () => {
      setIsRefreshingUser(true)
      try {
        setUser(await fetchCurrentUser(token))
      } catch (error) {
        clearAuthToken()
        setToken('')
        setUser(null)
        setStatus({
          kind: 'error',
          message: toMessage(error, 'Your session expired. Please sign in again.'),
        })
      } finally {
        setIsRefreshingUser(false)
      }
    }

    void loadUser()
  }, [token])

  const persistToken = (nextToken: string) => {
    writeAuthToken(nextToken)
    setToken(nextToken)
  }

  const updateLoginForm = <K extends keyof LoginFormState>(field: K, value: LoginFormState[K]) => {
    setLoginForm((current) => ({ ...current, [field]: value }))
  }

  const updateRegisterForm = <K extends keyof RegisterFormState>(field: K, value: RegisterFormState[K]) => {
    setRegisterForm((current) => ({ ...current, [field]: value }))
  }

  const resetStatus = () => {
    setStatus({ kind: 'idle', message: '' })
  }

  const signIn = async () => {
    setIsLoggingIn(true)
    resetStatus()

    try {
      const response = await loginUser(loginForm)
      persistToken(response.access_token)
      setLoginForm(initialLoginForm)
      setStatus({ kind: 'success', message: 'Signed in successfully.' })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error, 'Unable to sign in.') })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const register = async () => {
    setIsRegistering(true)
    resetStatus()

    try {
      await registerUser(registerForm)
      const loginResponse = await loginUser({
        email: registerForm.email,
        password: registerForm.password,
      })
      persistToken(loginResponse.access_token)
      setRegisterForm(initialRegisterForm)
      setStatus({ kind: 'success', message: 'Account created and signed in.' })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error, 'Unable to create your account.') })
    } finally {
      setIsRegistering(false)
    }
  }

  const signOut = () => {
    clearAuthToken()
    setToken('')
    setUser(null)
    setStatus({ kind: 'success', message: 'You have been signed out.' })
  }

  const refreshProfile = async () => {
    if (!token) {
      return
    }

    setIsRefreshingUser(true)
    resetStatus()

    try {
      setUser(await fetchCurrentUser(token))
      setStatus({ kind: 'success', message: 'Profile refreshed from the backend.' })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error, 'Unable to refresh your profile.') })
    } finally {
      setIsRefreshingUser(false)
    }
  }

  return {
    backendState,
    isAuthenticated,
    isLoggingIn,
    isRefreshingUser,
    isRegistering,
    loginForm,
    registerForm,
    sessionLabel,
    signIn,
    signOut,
    refreshProfile,
    register,
    status,
    token,
    updateLoginForm,
    updateRegisterForm,
    user,
  }
}
