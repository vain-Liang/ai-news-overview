type ImportMetaEnvLike = ImportMeta & {
  env?: {
    VITE_API_BASE_URL?: string
  }
}

type ErrorPayload = {
  detail?: string | { reason?: string; code?: string } | Array<{ msg?: string }>
}

const resolveApiBaseUrl = () => {
  const meta = import.meta as ImportMetaEnvLike
  return meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api'
}

const buildUrl = (path: string) => `${resolveApiBaseUrl()}${path}`

const getErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ErrorPayload

    if (typeof payload.detail === 'string') {
      return payload.detail
    }

    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
      return payload.detail[0].msg
    }

    if (payload.detail && typeof payload.detail === 'object' && !Array.isArray(payload.detail)) {
      return payload.detail.reason || payload.detail.code || 'Request failed'
    }
  } catch {
    // Ignore parsing error and fall back to HTTP status text.
  }

  return response.statusText || 'Request failed'
}

export const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
