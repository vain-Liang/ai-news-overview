export type AuthUser = {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  username: string | null
  nickname: string | null
  avatar_url?: string | null
}

export type StatusState = {
  kind: 'idle' | 'success' | 'error'
  message: string
}

export type BackendState = {
  kind: 'checking' | 'online' | 'offline'
  message: string
}

export type LoginFormState = {
  email: string
  password: string
}

export type RegisterFormState = {
  email: string
  password: string
  username: string
  nickname: string
}

export const initialLoginForm: LoginFormState = {
  email: '',
  password: '',
}

export const initialRegisterForm: RegisterFormState = {
  email: '',
  password: '',
  username: '',
  nickname: '',
}
