import {
  DEFAULT_TOKEN_PATH,
  readPublishKeyFromEnv,
  resolveWsUrlFromPublishKey,
} from '../constants/env.js'
import { parseEmbedExpiryMs } from '../core/embed-token.js'

export type Participant = {
  name: string
  userId?: string
  role?: string
}

export type ConnectionInfo = {
  token: string
  wsUrl: string
  expiresAt: string
}

type CacheEntry = ConnectionInfo & {
  expiresAtMs: number
}

export type StreamFlowClientOptions = {
  publishKey?: string
  tokenPath?: string
  initialToken?: string
  initialWsUrl?: string
  fetchImpl?: typeof fetch
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

function cacheKey(roomId: string, participant: Participant): string {
  return `${roomId}:${participant.userId ?? participant.name}`
}

function deriveWsFromWindow(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/^http/i, 'ws')
  }
  return 'ws://localhost:8080'
}

export class StreamFlowClient {
  private readonly publishKey: string
  private readonly tokenPath: string
  private readonly fetchImpl: typeof fetch
  private readonly cache = new Map<string, CacheEntry>()
  private initialToken?: string
  private initialWsUrl?: string
  private static instance: StreamFlowClient | null = null

  constructor(options: StreamFlowClientOptions = {}) {
    const publishKey = options.publishKey ?? readPublishKeyFromEnv()
    if (!publishKey && !options.initialToken) {
      throw new ConfigurationError(
        'Missing publish key. Set NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY or VITE_STREAMFLOW_PUBLISH_KEY.',
      )
    }
    this.publishKey = publishKey ?? ''
    this.tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH
    this.fetchImpl = options.fetchImpl ?? fetch
    this.initialToken = options.initialToken
    this.initialWsUrl = options.initialWsUrl
  }

  static create(options?: StreamFlowClientOptions): StreamFlowClient {
    if (!options || Object.keys(options).length === 0) {
      if (!StreamFlowClient.instance) {
        StreamFlowClient.instance = new StreamFlowClient()
      }
      return StreamFlowClient.instance
    }
    return new StreamFlowClient(options)
  }

  getPublishKey(): string {
    return this.publishKey
  }

  invalidate(roomId?: string, participant?: Participant): void {
    if (roomId && participant) {
      this.cache.delete(cacheKey(roomId, participant))
      return
    }
    this.cache.clear()
  }

  async getConnection(roomId: string, participant: Participant): Promise<ConnectionInfo> {
    const key = cacheKey(roomId, participant)
    const cached = this.cache.get(key)
    const refreshBufferMs = 60_000
    if (cached && cached.expiresAtMs - Date.now() > refreshBufferMs) {
      return { token: cached.token, wsUrl: cached.wsUrl, expiresAt: cached.expiresAt }
    }

    if (this.initialToken && !cached) {
      const expiresAtMs = parseEmbedExpiryMs(this.initialToken) ?? Date.now() + 3_600_000
      const entry: CacheEntry = {
        token: this.initialToken,
        wsUrl:
          this.initialWsUrl ??
          (this.publishKey
            ? resolveWsUrlFromPublishKey(this.publishKey)
            : deriveWsFromWindow()),
        expiresAt: new Date(expiresAtMs).toISOString(),
        expiresAtMs,
      }
      this.cache.set(key, entry)
      this.initialToken = undefined
      return { token: entry.token, wsUrl: entry.wsUrl, expiresAt: entry.expiresAt }
    }

    if (!this.publishKey) {
      throw new ConfigurationError(
        'Missing publish key. Cannot mint embed tokens without NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY.',
      )
    }

    const res = await this.fetchImpl(this.tokenPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-StreamFlow-Publish-Key': this.publishKey,
      },
      body: JSON.stringify({ roomId, participant }),
    })

    const json = (await res.json()) as {
      error?: string
      token?: string
      expiresAt?: string
      wsUrl?: string
    }

    if (!res.ok || !json.token || !json.wsUrl) {
      throw new Error(json.error ?? 'Failed to fetch embed token')
    }

    const expiresAtMs =
      parseEmbedExpiryMs(json.token) ??
      (json.expiresAt ? Date.parse(json.expiresAt) : Date.now() + 3_600_000)

    const entry: CacheEntry = {
      token: json.token,
      wsUrl: json.wsUrl,
      expiresAt: json.expiresAt ?? new Date(expiresAtMs).toISOString(),
      expiresAtMs,
    }
    this.cache.set(key, entry)
    return { token: entry.token, wsUrl: entry.wsUrl, expiresAt: entry.expiresAt }
  }
}
