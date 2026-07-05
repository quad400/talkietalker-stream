import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebhookSignature, WebhookSignatureError } from '../src/webhooks/verify.js'

function sign(secret: string, body: string, ts: number): string {
  const digest = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')
  return `t=${ts},v1=${digest}`
}

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test_secret'
  const body = JSON.stringify({ type: 'room.started', data: { id: 'room-1' } })
  const ts = Math.floor(Date.now() / 1000)

  it('verifies a valid signature', () => {
    const event = verifyWebhookSignature({
      rawBody: body,
      signatureHeader: sign(secret, body, ts),
      secret,
    })
    expect(event.type).toBe('room.started')
  })

  it('rejects invalid signature', () => {
    expect(() =>
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: sign(secret, body, ts).replace(/v1=\w+/, 'v1=deadbeef'),
        secret,
      }),
    ).toThrow(WebhookSignatureError)
  })

  it('rejects stale timestamps', () => {
    expect(() =>
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: sign(secret, body, ts - 10_000),
        secret,
        toleranceSec: 300,
      }),
    ).toThrow('timestamp outside tolerance')
  })
})
