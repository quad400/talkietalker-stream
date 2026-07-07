import { describe, expect, it } from 'vitest'
import {
  keyEnvironment,
  resolveBaseUrl,
  resolveWsUrl,
} from '../src/config/endpoints.js'

describe('endpoints', () => {
  it('resolves sandbox URL from sk_test key', () => {
    expect(resolveBaseUrl('sk_test_abc')).toBe('http://localhost:8080')
    expect(resolveWsUrl('sk_test_abc')).toBe('ws://localhost:8080')
  })

  it('resolves production URL from sk_live key', () => {
    expect(resolveBaseUrl('sk_live_abc')).toBe('https://api.talkietalker.stream')
    expect(resolveWsUrl('sk_live_abc')).toBe('wss://api.talkietalker.stream')
  })

  it('honors explicit override', () => {
    expect(resolveBaseUrl('sk_test_abc', 'https://custom.example.com')).toBe(
      'https://custom.example.com',
    )
  })

  it('detects key environment', () => {
    expect(keyEnvironment('pk_test_x')).toBe('test')
    expect(keyEnvironment('pk_live_x')).toBe('live')
  })
})
