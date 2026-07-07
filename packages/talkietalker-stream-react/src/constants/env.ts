export const ENV_NAMES = {
  publishKey: 'TALKIETALKER_STREAM_PUBLISH_KEY',
  publishKeyNext: 'NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY',
  publishKeyVite: 'VITE_TALKIETALKER_STREAM_PUBLISH_KEY',
} as const

export const DEFAULT_TOKEN_PATH = '/api/talkietalker-stream/token'

const SANDBOX_WS_URL = 'ws://localhost:8080'
const PRODUCTION_WS_URL = 'wss://api.talkietalker.stream'

export function resolveWsUrlFromPublishKey(publishKey: string): string {
  return publishKey.includes('_test_') ? SANDBOX_WS_URL : PRODUCTION_WS_URL
}

export function readPublishKeyFromEnv(): string | undefined {
  if (typeof process !== 'undefined') {
    const fromNext = process.env.NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY?.trim()
    if (fromNext) return fromNext
    const fromVite = process.env.VITE_TALKIETALKER_STREAM_PUBLISH_KEY?.trim()
    if (fromVite) return fromVite
    const generic = process.env.TALKIETALKER_STREAM_PUBLISH_KEY?.trim()
    if (generic) return generic
  }

  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    const vite = meta.env?.VITE_TALKIETALKER_STREAM_PUBLISH_KEY?.trim()
    if (vite) return vite
  }

  return undefined
}
