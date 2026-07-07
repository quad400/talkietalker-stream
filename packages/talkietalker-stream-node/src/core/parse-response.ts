import type { LastResponse } from '../types/index.js'

/** `{ status, message, data }` envelopes used by streams, projects, webhooks. */
export function isSuccessEnvelope(parsed: Record<string, unknown>): boolean {
  return typeof parsed.status === 'number' && 'data' in parsed && parsed.data !== undefined
}

/**
 * Unwrap API response bodies.
 * - Envelope responses return `data`
 * - Direct responses (recordings, live streams) pass through unchanged
 */
export function unwrapBody(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object') return parsed
  const obj = parsed as Record<string, unknown>
  if (isSuccessEnvelope(obj)) return obj.data
  return parsed
}

/** Attach non-enumerable `lastResponse` metadata to returned objects. */
export function attachLastResponse<T>(value: T, lastResponse: LastResponse): T {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    Object.defineProperty(value, 'lastResponse', {
      value: lastResponse,
      enumerable: false,
      configurable: true,
    })
  }
  return value
}
