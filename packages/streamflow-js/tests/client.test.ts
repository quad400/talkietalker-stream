import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { StreamFlow } from '../src/client.js'
import { RateLimitError } from '../src/errors.js'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('StreamFlow SDK', () => {
  it('creates a stream and unwraps envelope', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/streams', async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer sk_test_key')
        expect(request.headers.get('Idempotency-Key')).toBe('standup-key')
        return HttpResponse.json({
          status: 201,
          message: 'stream created successfully',
          data: { id: 'stream-1', title: 'Weekly standup', mode: 'room' },
        })
      }),
    )

    const sf = new StreamFlow({ apiKey: 'sk_test_key', baseURL: 'http://localhost:8080' })
    const stream = await sf.streams.create(
      { title: 'Weekly standup', mode: 'room' },
      { idempotencyKey: 'standup-key' },
    )
    expect(stream.id).toBe('stream-1')
  })

  it('retries on 429 with Retry-After', async () => {
    let calls = 0
    server.use(
      http.post('http://localhost:8080/api/v1/streams', () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json(
            { status: 429, error: 'rate limited', code: 'rate_limited', request_id: 'req_1' },
            { status: 429, headers: { 'Retry-After': '0' } },
          )
        }
        return HttpResponse.json({
          status: 201,
          message: 'ok',
          data: { id: 'stream-2', title: 'x' },
        })
      }),
    )

    const sf = new StreamFlow({ apiKey: 'sk_test_key', baseURL: 'http://localhost:8080', maxRetries: 2 })
    const stream = await sf.streams.create({ title: 'x' })
    expect(stream.id).toBe('stream-2')
    expect(calls).toBe(2)
  })

  it('parses typed errors with request_id', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/streams', () =>
        HttpResponse.json(
          { status: 400, error: 'invalid', code: 'validation_error', request_id: 'req_bad' },
          { status: 400 },
        ),
      ),
    )

    const sf = new StreamFlow({ apiKey: 'sk_test_key', baseURL: 'http://localhost:8080' })
    await expect(sf.streams.create({ title: '' })).rejects.toMatchObject({
      requestId: 'req_bad',
      code: 'validation_error',
    })
  })

  it('throws RateLimitError without retry when exhausted', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/streams', () =>
        HttpResponse.json({ status: 429, error: 'slow down', code: 'rate_limited' }, { status: 429 }),
      ),
    )

    const sf = new StreamFlow({ apiKey: 'sk_test_key', baseURL: 'http://localhost:8080', maxRetries: 0 })
    await expect(sf.streams.create({ title: 'x' })).rejects.toBeInstanceOf(RateLimitError)
  })
})
