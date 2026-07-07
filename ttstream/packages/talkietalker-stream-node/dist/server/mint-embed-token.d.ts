import type { ServerConfig } from '../config/server.js';
export type Participant = {
    name: string;
    userId?: string;
    role?: string;
};
export type MintEmbedTokenParams = {
    roomId: string;
    participant: Participant;
    ttlSeconds?: number;
};
export type MintEmbedTokenResult = {
    token: string;
    expiresAt: string;
    wsUrl: string;
};
/**
 * Mint an embed token for a room participant using the server secret key.
 * Used by framework handlers — prefer `createTalkieTalkerStreamHandlers` for HTTP routes.
 */
export declare function mintEmbedToken(config: ServerConfig, params: MintEmbedTokenParams): Promise<MintEmbedTokenResult>;
