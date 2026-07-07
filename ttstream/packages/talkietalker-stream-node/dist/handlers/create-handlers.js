import { resolveServerConfig } from '../config/server.js';
import { resolveProjectId } from './project-resolver.js';
import { handleTokenRequest } from './token.js';
import { handleWebhookRequest } from './webhook.js';
/**
 * Create framework-agnostic handlers for embed token minting and webhook ingestion.
 * Wire these into Express, Fastify, or Next.js via the `@talkietalker/stream-sdk/*` adapters.
 */
export function createTalkieTalkerStreamHandlers(options = {}) {
    let config = null;
    let projectIdPromise = null;
    const getConfig = () => {
        if (!config) {
            config = resolveServerConfig(options);
        }
        return config;
    };
    const getProjectId = () => {
        if (!projectIdPromise) {
            projectIdPromise = resolveProjectId(getConfig());
        }
        return projectIdPromise;
    };
    return {
        get projectId() {
            return getProjectId();
        },
        handleToken(body, headers) {
            return handleTokenRequest(getConfig(), options, body, headers);
        },
        handleWebhook(rawBody, signatureHeader) {
            return handleWebhookRequest(getConfig(), options, rawBody, signatureHeader);
        },
    };
}
