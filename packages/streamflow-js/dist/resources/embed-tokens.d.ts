import type { HttpClient } from '../http.js';
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
export interface RequestOpts {
    idempotencyKey?: string;
}
export declare class EmbedTokensResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateEmbedTokenParams, opts?: RequestOpts): Promise<EmbedToken>;
}
