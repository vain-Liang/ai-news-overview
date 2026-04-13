import type { AuthUser } from '../model'

export const getSessionLabel = (user: AuthUser | null) => user?.nickname || user?.username || user?.email || 'Not signed in'
