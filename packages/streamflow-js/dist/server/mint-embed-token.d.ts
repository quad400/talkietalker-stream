import type { ServerConfig } from './resolve-config.js';
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
export declare function mintEmbedToken(config: ServerConfig, params: MintEmbedTokenParams): Promise<MintEmbedTokenResult>;
