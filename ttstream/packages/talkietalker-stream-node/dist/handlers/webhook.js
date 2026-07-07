import { verifyWebhookSignature } from '../webhooks/verify.js';
/**
 * Handle `POST /webhooks` — verify signature and optionally dispatch to `onWebhook`.
 * Requires `TALKIETALKER_STREAM_WEBHOOK_SECRET` in server config.
 */
export async function handleWebhookRequest(config, options, rawBody, signatureHeader) {
    if (!config.webhookSecret) {
        throw new Error('TALKIETALKER_STREAM_WEBHOOK_SECRET not configured');
    }
    const event = verifyWebhookSignature({
        rawBody,
        signatureHeader,
        secret: config.webhookSecret,
    });
    if (options.onWebhook) {
        await options.onWebhook(event);
    }
    return { received: true, event };
}
