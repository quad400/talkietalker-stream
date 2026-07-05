import { ENV_NAMES, isSecretKey, isWebhookSecret, resolveBaseUrl, } from '../constants/endpoints.js';
import { ConfigurationError } from './errors.js';
function readEnv(name) {
    if (typeof process !== 'undefined' && process.env?.[name]) {
        return process.env[name];
    }
    return undefined;
}
export function resolveServerConfig(overrides) {
    const secretKey = overrides?.secretKey ?? readEnv(ENV_NAMES.secretKey);
    if (!secretKey) {
        throw new ConfigurationError(`Missing ${ENV_NAMES.secretKey}. Set it in your server environment.`);
    }
    if (!isSecretKey(secretKey)) {
        throw new ConfigurationError(`${ENV_NAMES.secretKey} must start with sk_test_ or sk_live_.`);
    }
    const webhookSecret = overrides?.webhookSecret ?? readEnv(ENV_NAMES.webhookSecret);
    if (webhookSecret && !isWebhookSecret(webhookSecret)) {
        throw new ConfigurationError(`${ENV_NAMES.webhookSecret} must start with whsec_.`);
    }
    const baseURL = resolveBaseUrl(secretKey, overrides?.baseURL ?? readEnv(ENV_NAMES.apiUrlOverride));
    return { secretKey, webhookSecret, baseURL };
}
export function defineStreamFlowConfig(config) {
    return config;
}
