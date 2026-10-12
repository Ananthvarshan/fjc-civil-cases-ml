/** Fetch wrapper: uses VITE_API_BASE env var, handles errors uniformly */

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

interface ApiError extends Error {
  status: number
}
function makeApiError(status: number, message: string): ApiError {
  const err = new Error(message) as ApiError
  err.name = 'ApiError'
  err.status = status
  return err
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw makeApiError(res.status, text)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:  <T>(path: string)               => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

export type { ApiError }
