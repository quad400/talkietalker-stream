export type WebhookEvent = {
    type: string;
    data: unknown;
    [key: string]: unknown;
};
export declare class WebhookSignatureError extends Error {
    constructor(message: string);
}
export declare function verifyWebhookSignature(opts: {
    rawBody: Buffer | string;
    signatureHeader: string;
    secret: string;
    toleranceSec?: number;
}): WebhookEvent;
