export type WebhookEvent = {
    type: string;
    data: unknown;
    [key: string]: unknown;
};
export declare class WebhookSignatureError extends Error {
    constructor(message: string);
}
/**
 * Verify an incoming webhook payload against the `X-TalkieTalker-Stream-Signature` header.
 * Must receive the raw request body — not parsed JSON.
 */
export declare function verifyWebhookSignature(opts: {
    rawBody: Buffer | string;
    signatureHeader: string;
    secret: string;
    toleranceSec?: number;
}): WebhookEvent;
