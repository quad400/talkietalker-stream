export interface StreamFlowErrorOptions {
  message: string
  statusCode?: number
  code?: string
  requestId?: string
}

export class StreamFlowError extends Error {
  readonly statusCode?: number
  readonly code?: string
  readonly requestId?: string

  constructor({ message, statusCode, code, requestId }: StreamFlowErrorOptions) {
    const suffix = requestId ? ` (request_id: ${requestId})` : ''
    super(`${message}${suffix}`)
    this.name = 'StreamFlowError'
    this.statusCode = statusCode
    this.code = code
    this.requestId = requestId
  }
}

export class RateLimitError extends StreamFlowError {
  retryAfter?: number

  constructor(opts: StreamFlowErrorOptions & { retryAfter?: number }) {
    super(opts)
    this.name = 'RateLimitError'
    this.retryAfter = opts.retryAfter
  }
}

export class ValidationError extends StreamFlowError {
  constructor(opts: StreamFlowErrorOptions) {
    super(opts)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends StreamFlowError {
  constructor(opts: StreamFlowErrorOptions) {
    super(opts)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends StreamFlowError {
  constructor(opts: StreamFlowErrorOptions) {
    super(opts)
    this.name = 'NotFoundError'
  }
}

export function parseError(status: number, body: unknown, headerRequestId?: string): StreamFlowError {
  const record = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  let code = typeof record.code === 'string' ? record.code : undefined
  let message = ''
  let requestId = typeof record.request_id === 'string' ? record.request_id : headerRequestId

  if (typeof record.error === 'string') {
    message = record.error
  } else if (typeof record.error === 'object' && record.error !== null) {
    const nested = record.error as Record<string, unknown>
    if (typeof nested.code === 'string') code = nested.code
    if (typeof nested.message === 'string') message = nested.message
  }

  if (!message) message = `Request failed with status ${status}`

  const base = { message, statusCode: status, code, requestId }

  if (status === 429 || code === 'rate_limited') return new RateLimitError(base)
  if (status === 400 || code === 'validation_error') return new ValidationError(base)
  if (status === 401 || code === 'unauthorized') return new AuthenticationError(base)
  if (status === 404 || code === 'not_found') return new NotFoundError(base)
  return new StreamFlowError(base)
}
