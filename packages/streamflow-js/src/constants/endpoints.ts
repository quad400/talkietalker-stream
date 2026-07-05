const SANDBOX_API_URL = 'http://localhost:8080'
const PRODUCTION_API_URL = 'https://api.streamflow.io'
const SANDBOX_WS_URL = 'ws://localhost:8080'
const PRODUCTION_WS_URL = 'wss://api.streamflow.io'

export const ENV_NAMES = {
  secretKey: 'STREAMFLOW_SECRET_KEY',
  webhookSecret: 'STREAMFLOW_WEBHOOK_SECRET',
  apiUrlOverride: 'STREAMFLOW_API_URL',
} as const

export type KeyEnvironment = 'test' | 'live'

export function keyEnvironment(key: string): KeyEnvironment {
  if (key.includes('_test_')) return 'test'
  return 'live'
}

export function isPublishableKey(key: string): boolean {
  return key.startsWith('pk_test_') || key.startsWith('pk_live_')
}

export function isSecretKey(key: string): boolean {
  return key.startsWith('sk_test_') || key.startsWith('sk_live_')
}

export function isWebhookSecret(secret: string): boolean {
  return secret.startsWith('whsec_')
}

export function resolveBaseUrl(key: string, override?: string): string {
  const trimmed = override?.replace(/\/$/, '')
  if (trimmed) return trimmed
  return keyEnvironment(key) === 'test' ? SANDBOX_API_URL : PRODUCTION_API_URL
}

export function resolveWsUrl(key: string, apiUrl?: string): string {
  const base = (apiUrl ?? resolveBaseUrl(key)).replace(/\/$/, '')
  return base.replace(/^http/i, 'ws')
}

export function defaultApiUrlForEnv(env: KeyEnvironment): string {
  return env === 'test' ? SANDBOX_API_URL : PRODUCTION_API_URL
}

export function defaultWsUrlForEnv(env: KeyEnvironment): string {
  return env === 'test' ? SANDBOX_WS_URL : PRODUCTION_WS_URL
}
