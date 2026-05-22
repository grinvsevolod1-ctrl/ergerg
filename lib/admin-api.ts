/**
 * Helper for making authenticated admin API requests
 * Uses HTTP-only cookies for authentication (credentials: 'include')
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include HTTP-only cookies
  })
}

/**
 * Helper for making authenticated admin API requests with JSON response
 */
export async function adminFetchJson<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await adminFetch(url, options)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}
