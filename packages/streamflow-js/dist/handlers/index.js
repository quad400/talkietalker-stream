import { isPublishableKey } from '../constants/endpoints.js';
import { mintEmbedToken } from '../server/mint-embed-token.js';
import { resolveServerConfig } from '../server/resolve-config.js';
import { verifyWebhookSignature } from '../webhooks/verify.js';
let cachedProjectId = null;
async function readSdkConfig(config, key) {
    const res = await fetch(`${config.baseURL}/api/v1/sdk/config`, {
        headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
        throw new Error('invalid key');
    }
    const json = (await res.json());
    const projectId = json.data?.project_id ?? json.project_id;
    if (!projectId) {
        throw new Error('project_id missing from sdk config');
    }
    return projectId;
}
async function resolveProjectId(config) {
    if (cachedProjectId?.secretKey === config.secretKey) {
        return cachedProjectId.projectId;
    }
    const projectId = await readSdkConfig(config, config.secretKey);
    cachedProjectId = { secretKey: config.secretKey, projectId };
    return projectId;
}
async function validatePublishKey(config, publishKey) {
    if (!isPublishableKey(publishKey)) {
        throw new Error('invalid publish key');
    }
    const publishProjectId = await readSdkConfig(config, publishKey);
    const secretProjectId = await resolveProjectId(config);
    if (publishProjectId !== secretProjectId) {
        throw new Error('publish key does not match secret key project');
    }
}
export function createStreamFlowHandlers(options = {}) {
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
        async handleToken(body, headers) {
            const resolvedConfig = getConfig();
            const publishKey = headers.publishKey?.trim();
            if (!publishKey) {
                throw new Error('missing X-StreamFlow-Publish-Key header');
            }
            await validatePublishKey(resolvedConfig, publishKey);
            let participant = body.participant;
            if (options.authenticateTokenRequest) {
                const authed = await options.authenticateTokenRequest({ body, headers });
                if (!authed) {
                    throw new Error('unauthorized');
                }
                participant = authed;
            }
            if (!participant) {
                const name = body.participantName?.trim() || body.participant?.name?.trim();
                if (!name) {
                    throw new Error('participant.name is required');
                }
                participant = {
                    name,
                    userId: body.participant?.userId,
                    role: body.participant?.role,
                };
            }
            const roomId = body.roomId?.trim();
            if (!roomId) {
                throw new Error('roomId is required');
            }
            return mintEmbedToken(resolvedConfig, { roomId, participant });
        },
        async handleWebhook(rawBody, signatureHeader) {
            const resolvedConfig = getConfig();
            if (!resolvedConfig.webhookSecret) {
                throw new Error('STREAMFLOW_WEBHOOK_SECRET not configured');
            }
            const event = verifyWebhookSignature({
                rawBody,
                signatureHeader,
                secret: resolvedConfig.webhookSecret,
            });
            if (options.onWebhook) {
                await options.onWebhook(event);
            }
            return { received: true, event };
        },
    };
}
