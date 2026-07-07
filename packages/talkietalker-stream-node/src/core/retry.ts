/** Parse Retry-After header (seconds or HTTP-date) into milliseconds. */
export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (!Number.isNaN(seconds)) return seconds * 1000
  const date = Date.parse(header)
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now())
  return undefined
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
