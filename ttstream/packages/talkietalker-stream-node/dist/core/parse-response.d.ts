import type { LastResponse } from '../types/index.js';
/** `{ status, message, data }` envelopes used by streams, projects, webhooks. */
export declare function isSuccessEnvelope(parsed: Record<string, unknown>): boolean;
/**
 * Unwrap API response bodies.
 * - Envelope responses return `data`
 * - Direct responses (recordings, live streams) pass through unchanged
 */
export declare function unwrapBody(parsed: unknown): unknown;
/** Attach non-enumerable `lastResponse` metadata to returned objects. */
export declare function attachLastResponse<T>(value: T, lastResponse: LastResponse): T;
