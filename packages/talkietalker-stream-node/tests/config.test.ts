import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveClientConfig } from '../src/config/client.js'
import { TalkieTalkerStream } from '../src/client.js'

describe('resolveClientConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads secretKey from env', () => {
    vi.stubEnv('TALKIETALKER_STREAM_SECRET_KEY', 'sk_test_abcdefghijklmnopqrstuvwxyz1234')
    const config = resolveClientConfig()
    expect(config.secretKey).toContain('sk_test_')
    expect(config.baseURL).toBe('http://localhost:8080')
  })

  it('reads publishKey from env', () => {
    vi.stubEnv('TALKIETALKER_STREAM_SECRET_KEY', 'sk_test_abcdefghijklmnopqrstuvwxyz1234')
    vi.stubEnv('TALKIETALKER_STREAM_PUBLISH_KEY', 'pk_test_abcdefghijklmnopqrstuvwxyz1234')
    const config = resolveClientConfig()
    expect(config.publishKey).toContain('pk_test_')
  })

  it('throws when secretKey missing', () => {
    vi.stubEnv('TALKIETALKER_STREAM_SECRET_KEY', '')
    expect(() => resolveClientConfig()).toThrow(/secretKey/)
  })
})

describe('TalkieTalkerStream', () => {
  it('exposes secretKey and optional publishKey', () => {
    const sf = new TalkieTalkerStream({
      secretKey: 'sk_test_abc',
      publishKey: 'pk_test_xyz',
      baseURL: 'http://localhost:8080',
    })
    expect(sf.secretKey).toBe('sk_test_abc')
    expect(sf.publishKey).toBe('pk_test_xyz')
  })
})
