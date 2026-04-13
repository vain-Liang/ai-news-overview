const storageKey = 'ai-news-review.auth-token'

export const readAuthToken = () => window.localStorage.getItem(storageKey) ?? ''

export const writeAuthToken = (token: string) => {
  window.localStorage.setItem(storageKey, token)
}

export const clearAuthToken = () => {
  window.localStorage.removeItem(storageKey)
}
