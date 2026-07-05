export declare const ENV_NAMES: {
    readonly secretKey: "STREAMFLOW_SECRET_KEY";
    readonly webhookSecret: "STREAMFLOW_WEBHOOK_SECRET";
    readonly apiUrlOverride: "STREAMFLOW_API_URL";
};
export type KeyEnvironment = 'test' | 'live';
export declare function keyEnvironment(key: string): KeyEnvironment;
export declare function isPublishableKey(key: string): boolean;
export declare function isSecretKey(key: string): boolean;
export declare function isWebhookSecret(secret: string): boolean;
export declare function resolveBaseUrl(key: string, override?: string): string;
export declare function resolveWsUrl(key: string, apiUrl?: string): string;
export declare function defaultApiUrlForEnv(env: KeyEnvironment): string;
export declare function defaultWsUrlForEnv(env: KeyEnvironment): string;
