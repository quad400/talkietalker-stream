import { mintEmbedToken } from '../server/mint-embed-token.js'
import type { ServerConfig } from '../config/server.js'
import { validatePublishKey } from './project-resolver.js'
import type { HandlerOptions, TokenRequestBody, TokenRequestHeaders, TokenResponse } from './types.js'

/**
 * Handle `POST /token` — validate publish key and mint an embed token for a room.
 */
export async function handleTokenRequest(
  config: ServerConfig,
  options: HandlerOptions,
  body: TokenRequestBody,
  headers: TokenRequestHeaders,
): Promise<TokenResponse> {
  const publishKey = headers.publishKey?.trim()
  if (!publishKey) {
    throw new Error('missing X-TalkieTalker-Stream-Publish-Key header')
  }

  await validatePublishKey(config, publishKey)

  let participant = body.participant
  if (options.authenticateTokenRequest) {
    const authed = await options.authenticateTokenRequest({ body, headers })
    if (!authed) {
      throw new Error('unauthorized')
    }
    participant = authed
  }

  if (!participant) {
    const name = body.participantName?.trim() || body.participant?.name?.trim()
    if (!name) {
      throw new Error('participant.name is required')
    }
    participant = {
      name,
      userId: body.participant?.userId,
      role: body.participant?.role,
    }
  }

  const roomId = body.roomId?.trim()
  if (!roomId) {
    throw new Error('roomId is required')
  }

  return mintEmbedToken(config, { roomId, participant })
}
