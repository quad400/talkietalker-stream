import type { HttpClient } from './HttpClient.js'
import type { RequestOptions } from '../types/index.js'

export type MakeRequestOptions = RequestOptions & {
  method: string
  path: string
  body?: unknown
}

/**
 * Base class for API resource namespaces (`streams`, `projects`, etc.).
 * Subclasses call `_makeRequest` with method, path, and body.
 */
export class TalkieTalkerStreamResource {
  constructor(protected readonly http: HttpClient) {}

  protected _makeRequest<T>(opts: MakeRequestOptions): Promise<T> {
    return this.http.request<T>({
      method: opts.method,
      path: opts.path,
      body: opts.body,
      idempotencyKey: opts.idempotencyKey,
      unauthenticated: opts.unauthenticated,
    })
  }
}
