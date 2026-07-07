/** Environment variable names used by the SDK. */
export declare const ENV_NAMES: {
    readonly secretKey: "TALKIETALKER_STREAM_SECRET_KEY";
    readonly publishKey: "TALKIETALKER_STREAM_PUBLISH_KEY";
    readonly publishKeyPublic: "NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY";
    readonly webhookSecret: "TALKIETALKER_STREAM_WEBHOOK_SECRET";
    readonly apiUrlOverride: "TALKIETALKER_STREAM_API_URL";
};
export type KeyEnvironment = 'test' | 'live';
export declare function keyEnvironment(key: string): KeyEnvironment;
export declare function isPublishableKey(key: string): boolean;
export declare function isSecretKey(key: string): boolean;
export declare function isWebhookSecret(secret: string): boolean;
/** Resolve REST base URL from key prefix, with optional override. */
export declare function resolveBaseUrl(key: string, override?: string): string;
/** Derive WebSocket base URL from the REST base URL. */
export declare function resolveWsUrl(key: string, apiUrl?: string): string;
export declare function defaultApiUrlForEnv(env: KeyEnvironment): string;
export declare function defaultWsUrlForEnv(env: KeyEnvironment): string;
