import type { RequestInit } from 'next/dist/server/web/spec-extension/request'

type JsonInput = Omit<RequestInit, 'body'> & {
  body?: unknown
}

interface DashboardApiError extends Error {
  status: number
}

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    // Fallback for non-JSON responses
    return {} as T
  }
}

export async function dashboardFetch<T = unknown>(
  input: string,
  init: JsonInput = {},
): Promise<T> {
  const { body, headers, ...rest } = init

  const finalHeaders = new Headers(headers)
  if (body && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  const res = await fetch(input, {
    credentials: 'include',
    ...rest,
    headers: finalHeaders,
    body: body != null && typeof body !== 'string' ? JSON.stringify(body) : (body as any),
  })

  if (!res.ok) {
    const data = await parseJSON<{ error?: string }>(res)
    const error: DashboardApiError = Object.assign(
      new Error(data.error || `Request failed with status ${res.status}`),
      { status: res.status },
    )
    throw error
  }

  return parseJSON<T>(res)
}

