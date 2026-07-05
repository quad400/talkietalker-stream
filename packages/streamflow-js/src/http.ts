import { parseError, RateLimitError } from './errors.js'

export interface HttpClientOptions {
  apiKey?: string
  accessToken?: string
  baseURL?: string
  maxRetries?: number
  fetchImpl?: typeof fetch
}

export interface RequestOptions {
  method: string
  path: string
  body?: unknown
  idempotencyKey?: string
  useJWT?: boolean
}

const DEFAULT_BASE_URL = 'https://api.streamflow.io'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (!Number.isNaN(seconds)) return seconds * 1000
  const date = Date.parse(header)
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now())
  return undefined
}

export class HttpClient {
  private readonly apiKey?: string
  private readonly accessToken?: string
  private readonly baseURL: string
  private readonly maxRetries: number
  private readonly fetchImpl: typeof fetch

  constructor(opts: HttpClientOptions) {
    this.apiKey = opts.apiKey
    this.accessToken = opts.accessToken
    this.baseURL = (opts.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.maxRetries = opts.maxRetries ?? 3
    this.fetchImpl = opts.fetchImpl ?? fetch
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    let attempt = 0
    while (true) {
      try {
        return await this.doRequest<T>(opts)
      } catch (err) {
        if (!(err instanceof RateLimitError) || attempt >= this.maxRetries) throw err
        const delay = err.retryAfter ?? Math.min(1000 * 2 ** attempt, 8000)
        attempt += 1
        await sleep(delay)
      }
    }
  }

  private async doRequest<T>(opts: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    const token = opts.useJWT ? this.accessToken : this.apiKey
    if (!token) {
      throw new Error('Missing API key or access token for request')
    }
    headers.Authorization = `Bearer ${token}`

    if (opts.idempotencyKey) {
      headers['Idempotency-Key'] = opts.idempotencyKey
    }

    const response = await this.fetchImpl(`${this.baseURL}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })

    const text = await response.text()
    const parsed = text ? JSON.parse(text) : {}

    if (!response.ok) {
      const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get('Retry-After')) : undefined
      const err = parseError(response.status, parsed, response.headers.get('X-Request-ID') ?? undefined)
      if (err instanceof RateLimitError && retryAfter !== undefined) {
        err.retryAfter = retryAfter
      }
      throw err
    }

    if (parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data !== undefined) {
      return parsed.data as T
    }
    return parsed as T
  }
}
