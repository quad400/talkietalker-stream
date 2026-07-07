/** Build a URL query string from key/value pairs (skips undefined). */
export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key as keyof T] = value as T[keyof T]
  }
  return out
}
