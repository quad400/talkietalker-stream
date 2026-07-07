import { TalkieTalkerStream } from '../client.js'
import { resolveWsUrl } from '../config/endpoints.js'
import type { ServerConfig } from '../config/server.js'

export type Participant = {
  name: string
  userId?: string
  role?: string
}

export type MintEmbedTokenParams = {
  roomId: string
  participant: Participant
  ttlSeconds?: number
}

export type MintEmbedTokenResult = {
  token: string
  expiresAt: string
  wsUrl: string
}

/**
 * Mint an embed token for a room participant using the server secret key.
 * Used by framework handlers — prefer `createTalkieTalkerStreamHandlers` for HTTP routes.
 */
export async function mintEmbedToken(
  config: ServerConfig,
  params: MintEmbedTokenParams,
): Promise<MintEmbedTokenResult> {
  const client = new TalkieTalkerStream({
    secretKey: config.secretKey,
    publishKey: config.publishKey,
    baseURL: config.baseURL,
  })

  const result = await client.embedTokens.create({
    resourceType: 'room',
    resourceId: params.roomId,
    participant: {
      name: params.participant.name,
      userId: params.participant.userId,
      role: params.participant.role,
    },
    ttlSeconds: params.ttlSeconds,
  })

  return {
    token: result.token,
    expiresAt: result.expires_at,
    wsUrl: resolveWsUrl(config.secretKey, config.baseURL),
  }
}
