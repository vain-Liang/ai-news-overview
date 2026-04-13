import { request } from '../../../shared/api/http.ts'
import type { AuthUser, LoginFormState, RegisterFormState } from '../model.ts'

type LoginResponse = {
  access_token: string
  token_type: 'bearer'
}

export const healthcheck = () => request<{ status: string }>('/healthz')

export const registerUser = (payload: RegisterFormState) =>
  request<AuthUser>('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

export const loginUser = async (payload: LoginFormState) => {
  const body = new URLSearchParams({
    username: payload.email,
    password: payload.password,
  })

  return request<LoginResponse>('/auth/jwt/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
}

export const fetchCurrentUser = (token: string) =>
  request<AuthUser>('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
