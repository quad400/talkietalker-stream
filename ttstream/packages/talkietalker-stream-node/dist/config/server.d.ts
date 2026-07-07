/** Resolved server-side configuration for handlers and token minting. */
export type ServerConfig = {
    secretKey: string;
    publishKey?: string;
    webhookSecret?: string;
    baseURL: string;
};
export type TalkieTalkerStreamServerConfig = {
    secretKey?: string;
    publishKey?: string;
    webhookSecret?: string;
    baseURL?: string;
};
/**
 * Resolve server config from options or `TALKIETALKER_STREAM_*` environment variables.
 * Used by framework handlers — not required for direct REST client usage.
 */
export declare function resolveServerConfig(overrides?: TalkieTalkerStreamServerConfig): ServerConfig;
/** Helper for typed server config in app bootstrap files. */
export declare function defineTalkieTalkerStreamConfig(config: TalkieTalkerStreamServerConfig): TalkieTalkerStreamServerConfig;
