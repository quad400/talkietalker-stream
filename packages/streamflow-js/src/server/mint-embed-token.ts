import { StreamFlow } from '../client.js'
import { resolveWsUrl } from '../constants/endpoints.js'
import type { ServerConfig } from './resolve-config.js'

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

export async function mintEmbedToken(
  config: ServerConfig,
  params: MintEmbedTokenParams,
): Promise<MintEmbedTokenResult> {
  const client = new StreamFlow({
    apiKey: config.secretKey,
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
