import { StreamFlow } from '../client.js';
import { resolveWsUrl } from '../constants/endpoints.js';
export async function mintEmbedToken(config, params) {
    const client = new StreamFlow({
        apiKey: config.secretKey,
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
