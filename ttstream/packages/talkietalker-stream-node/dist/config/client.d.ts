import type { TalkieTalkerStreamConfig } from '../types/index.js';
export type ResolvedClientConfig = TalkieTalkerStreamConfig & {
    secretKey: string;
    baseURL: string;
};
/**
 * Resolve and validate client configuration from explicit options or environment.
 * @throws If `secretKey` is missing or malformed.
 */
export declare function resolveClientConfig(overrides?: TalkieTalkerStreamConfig): ResolvedClientConfig;
