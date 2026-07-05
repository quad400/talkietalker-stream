import { createHmac, timingSafeEqual } from 'node:crypto'

export type WebhookEvent = {
  type: string
  data: unknown
  [key: string]: unknown
}

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookSignatureError'
  }
}

export function verifyWebhookSignature(opts: {
  rawBody: Buffer | string
  signatureHeader: string
  secret: string
  toleranceSec?: number
}): WebhookEvent {
  const toleranceSec = opts.toleranceSec ?? 300
  const body = typeof opts.rawBody === 'string' ? opts.rawBody : opts.rawBody.toString('utf8')

  const parts = Object.fromEntries(
    opts.signatureHeader.split(',').map((part) => {
      const [key, value] = part.trim().split('=')
      return [key, value]
    }),
  ) as Record<string, string>

  const ts = Number(parts.t)
  const v1 = parts.v1
  if (!ts || !v1) {
    throw new WebhookSignatureError('invalid signature header')
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - ts) > toleranceSec) {
    throw new WebhookSignatureError('timestamp outside tolerance')
  }

  const expected = createHmac('sha256', opts.secret)
    .update(`${ts}.${body}`)
    .digest('hex')

  const a = Buffer.from(v1)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new WebhookSignatureError('signature mismatch')
  }

  let event: WebhookEvent
  try {
    event = JSON.parse(body) as WebhookEvent
  } catch {
    throw new WebhookSignatureError('invalid json body')
  }

  return event
}
