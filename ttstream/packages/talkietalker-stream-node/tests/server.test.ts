import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveServerConfig } from '../src/config/server.js'
import { ConfigurationError } from '../src/server/errors.js'

describe('resolveServerConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads secret key from env', () => {
    vi.stubEnv('TALKIETALKER_STREAM_SECRET_KEY', 'sk_test_abcdefghijklmnopqrstuvwxyz1234')
    const config = resolveServerConfig()
    expect(config.secretKey).toContain('sk_test_')
    expect(config.baseURL).toBe('http://localhost:8080')
  })

  it('throws when secret key missing', () => {
    vi.stubEnv('TALKIETALKER_STREAM_SECRET_KEY', '')
    expect(() => resolveServerConfig()).toThrow(ConfigurationError)
  })
})
