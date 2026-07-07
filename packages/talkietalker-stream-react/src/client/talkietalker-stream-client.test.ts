import { describe, expect, it, vi } from 'vitest'
import { TalkieTalkerStreamClient } from './talkietalker-stream-client.js'

describe('TalkieTalkerStreamClient', () => {
  it('fetches token and wsUrl from app server', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
        expiresAt: '2099-01-01T00:00:00Z',
        wsUrl: 'ws://localhost:8080',
      }),
    })

    const client = new TalkieTalkerStreamClient({
      publishKey: 'pk_test_abcdefghijklmnopqrstuvwxyz1234',
      fetchImpl,
    })

    const connection = await client.getConnection('room-1', { name: 'Student' })
    expect(connection.wsUrl).toBe('ws://localhost:8080')
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/talkietalker-stream/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-TalkieTalker-Stream-Publish-Key': 'pk_test_abcdefghijklmnopqrstuvwxyz1234',
        }),
      }),
    )
  })

  it('uses initialToken without fetching when provided', async () => {
    const fetchImpl = vi.fn()
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig'

    const client = new TalkieTalkerStreamClient({
      initialToken: token,
      fetchImpl,
    })

    const connection = await client.getConnection('room-1', { name: 'Guest' })
    expect(connection.token).toBe(token)
    expect(connection.wsUrl).toBe('ws://localhost:8080')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('resolves wsUrl from publish key for initialToken', async () => {
    const client = new TalkieTalkerStreamClient({
      publishKey: 'pk_live_abcdefghijklmnopqrstuvwxyz1234',
      initialToken: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
    })

    const connection = await client.getConnection('room-1', { name: 'Guest' })
    expect(connection.wsUrl).toBe('wss://api.talkietalker.stream')
  })
})
