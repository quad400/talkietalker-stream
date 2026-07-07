import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { RequestOptions } from '../types/index.js';
export interface CreateEmbedTokenParams {
    resourceType: 'room';
    resourceId: string;
    participant: {
        name: string;
        role?: string;
        userId?: string;
    };
    ttlSeconds?: number;
}
export interface EmbedToken {
    token: string;
    expires_at: string;
}
/** Mint short-lived JWTs for embedded room participants (`/api/v1/embed-tokens`). */
export declare class EmbedTokensResource extends TalkieTalkerStreamResource {
    create(params: CreateEmbedTokenParams, opts?: RequestOptions): Promise<EmbedToken>;
}
