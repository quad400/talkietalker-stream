const SANDBOX_API_URL = 'http://localhost:8080';
const PRODUCTION_API_URL = 'https://api.talkietalker.stream';
const SANDBOX_WS_URL = 'ws://localhost:8080';
const PRODUCTION_WS_URL = 'wss://api.talkietalker.stream';
/** Environment variable names used by the SDK. */
export const ENV_NAMES = {
    secretKey: 'TALKIETALKER_STREAM_SECRET_KEY',
    publishKey: 'TALKIETALKER_STREAM_PUBLISH_KEY',
    publishKeyPublic: 'NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY',
    webhookSecret: 'TALKIETALKER_STREAM_WEBHOOK_SECRET',
    apiUrlOverride: 'TALKIETALKER_STREAM_API_URL',
};
export function keyEnvironment(key) {
    if (key.includes('_test_'))
        return 'test';
    return 'live';
}
export function isPublishableKey(key) {
    return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}
export function isSecretKey(key) {
    return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}
export function isWebhookSecret(secret) {
    return secret.startsWith('whsec_');
}
/** Resolve REST base URL from key prefix, with optional override. */
export function resolveBaseUrl(key, override) {
    const trimmed = override?.replace(/\/$/, '');
    if (trimmed)
        return trimmed;
    return keyEnvironment(key) === 'test' ? SANDBOX_API_URL : PRODUCTION_API_URL;
}
/** Derive WebSocket base URL from the REST base URL. */
export function resolveWsUrl(key, apiUrl) {
    const base = (apiUrl ?? resolveBaseUrl(key)).replace(/\/$/, '');
    return base.replace(/^http/i, 'ws');
}
export function defaultApiUrlForEnv(env) {
    return env === 'test' ? SANDBOX_API_URL : PRODUCTION_API_URL;
}
export function defaultWsUrlForEnv(env) {
    return env === 'test' ? SANDBOX_WS_URL : PRODUCTION_WS_URL;
}
