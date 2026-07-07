import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { TalkieTalkerStream } from '../src/client.js'
import { RateLimitError } from '../src/errors.js'

const server = setupServer()
const base = 'http://localhost:8080'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('TalkieTalkerStream SDK', () => {
  it('creates a stream and unwraps envelope', async () => {
    server.use(
      http.post(`${base}/api/v1/streams`, async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer sk_test_key')
        expect(request.headers.get('Idempotency-Key')).toBe('standup-key')
        return HttpResponse.json(
          {
            status: 201,
            message: 'stream created successfully',
            data: { id: 'stream-1', title: 'Weekly standup', mode: 'room', status: 'idle', user_id: 'u1' },
          },
          { status: 201 },
        )
      }),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base })
    const stream = await sf.streams.create({ title: 'Weekly standup', mode: 'room' }, { idempotencyKey: 'standup-key' })
    expect(stream.id).toBe('stream-1')
    expect((stream as { lastResponse?: { statusCode: number } }).lastResponse?.statusCode).toBe(201)
  })

  it('lists recordings with direct response shape', async () => {
    server.use(
      http.get(`${base}/api/v1/recordings`, () =>
        HttpResponse.json({
          data: [{ id: 'rec-1', stream_id: 'stream-1', status: 'ready' }],
          pagination: { page: 1, limit: 20, total: 1 },
        }),
      ),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base })
    const result = await sf.recordings.list()
    expect(result.data).toHaveLength(1)
    expect(result.pagination?.total).toBe(1)
  })

  it('fetches chat history from wrapped envelope', async () => {
    server.use(
      http.get(`${base}/api/v1/streams/stream-1/chat/history`, () =>
        HttpResponse.json({
          status: 200,
          message: 'ok',
          data: { data: [{ id: 'msg-1', content: 'hello' }], has_more: false },
        }),
      ),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base })
    const history = await sf.chat.listHistory('stream-1')
    expect(history.data[0].content).toBe('hello')
  })

  it('creates webhook endpoint for project', async () => {
    server.use(
      http.post(`${base}/api/v1/projects/proj-1/webhooks`, async ({ request }) => {
        const body = (await request.json()) as { url: string }
        return HttpResponse.json({
          status: 201,
          data: { id: 'wh-1', project_id: 'proj-1', url: body.url, enabled_events: ['stream.*'], status: 'enabled', created_at: '', updated_at: '' },
        })
      }),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base })
    const endpoint = await sf.webhooks.create('proj-1', { url: 'https://example.com/hook', enabledEvents: ['stream.*'] })
    expect(endpoint.id).toBe('wh-1')
  })

  it('retries on 429 with Retry-After', async () => {
    let calls = 0
    server.use(
      http.post(`${base}/api/v1/streams`, () => {
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
          data: { id: 'stream-2', title: 'x', status: 'idle', user_id: 'u1' },
        })
      }),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base, maxRetries: 2 })
    const stream = await sf.streams.create({ title: 'x' })
    expect(stream.id).toBe('stream-2')
    expect(calls).toBe(2)
  })

  it('parses typed errors with request_id', async () => {
    server.use(
      http.post(`${base}/api/v1/streams`, () =>
        HttpResponse.json(
          { status: 400, error: 'invalid', code: 'validation_error', request_id: 'req_bad' },
          { status: 400 },
        ),
      ),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base })
    await expect(sf.streams.create({ title: '' })).rejects.toMatchObject({
      requestId: 'req_bad',
      code: 'validation_error',
    })
  })

  it('throws RateLimitError without retry when exhausted', async () => {
    server.use(
      http.post(`${base}/api/v1/streams`, () =>
        HttpResponse.json({ status: 429, error: 'slow down', code: 'rate_limited' }, { status: 429 }),
      ),
    )

    const sf = new TalkieTalkerStream({ secretKey: 'sk_test_key', baseURL: base, maxRetries: 0 })
    await expect(sf.streams.create({ title: 'x' })).rejects.toBeInstanceOf(RateLimitError)
  })
})
