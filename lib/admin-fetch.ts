"use client"

import { toast } from "sonner"

/**
 * Shared client-side fetch helper for the admin panel.
 *
 * Goals:
 * - Always send credentials (session cookie).
 * - Centralize 401 handling: notify once and redirect to /admin/login.
 * - Parse a consistent { error } body so callers get a clean message.
 *
 * Usage:
 *   const data = await adminFetch<MyType>("/api/admin/leads")
 *   await adminFetch("/api/admin/leads/123", { method: "DELETE" })
 *
 * On non-OK responses it throws an Error with a readable message.
 * On 401 it throws AdminUnauthorizedError after triggering the redirect,
 * so callers can simply `return` inside their catch without extra toasts.
 */

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Сессия истекла. Войдите снова.")
    this.name = "AdminUnauthorizedError"
  }
}

let redirecting = false

function handleUnauthorized() {
  if (redirecting) return
  redirecting = true
  toast.error("Сессия истекла. Выполняется переход на страницу входа…")
  // Give the toast a moment, then redirect.
  setTimeout(() => {
    const next = encodeURIComponent(window.location.pathname)
    window.location.href = `/admin/login?next=${next}`
  }, 1200)
}

export async function adminFetch<T = unknown>(
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
  })

  if (res.status === 401) {
    handleUnauthorized()
    throw new AdminUnauthorizedError()
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `Ошибка запроса (HTTP ${res.status})`)
  }

  // 204 No Content / empty body safety.
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

/** Convenience: show a toast for any thrown error, ignoring the 401 case. */
export function reportAdminError(error: unknown, fallback: string) {
  if (error instanceof AdminUnauthorizedError) return
  console.error(fallback, error)
  toast.error(error instanceof Error ? error.message : fallback)
}
