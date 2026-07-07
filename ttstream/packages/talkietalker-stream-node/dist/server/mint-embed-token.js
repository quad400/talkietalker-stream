import { TalkieTalkerStream } from '../client.js';
import { resolveWsUrl } from '../config/endpoints.js';
/**
 * Mint an embed token for a room participant using the server secret key.
 * Used by framework handlers — prefer `createTalkieTalkerStreamHandlers` for HTTP routes.
 */
export async function mintEmbedToken(config, params) {
    const client = new TalkieTalkerStream({
        secretKey: config.secretKey,
        publishKey: config.publishKey,
        baseURL: config.baseURL,
    });
    const result = await client.embedTokens.create({
        resourceType: 'room',
        resourceId: params.roomId,
        participant: {
            name: params.participant.name,
            userId: params.participant.userId,
            role: params.participant.role,
        },
        ttlSeconds: params.ttlSeconds,
    });
    return {
        token: result.token,
        expiresAt: result.expires_at,
        wsUrl: resolveWsUrl(config.secretKey, config.baseURL),
    };
}
