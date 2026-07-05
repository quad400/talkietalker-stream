import { type Participant } from '../server/mint-embed-token.js';
import { type StreamFlowServerConfig } from '../server/resolve-config.js';
import { type WebhookEvent } from '../webhooks/verify.js';
export type TokenRequestBody = {
    roomId?: string;
    participant?: Participant;
    participantName?: string;
};
export type TokenRequestHeaders = {
    publishKey?: string | null;
};
export type TokenResponse = {
    token: string;
    expiresAt: string;
    wsUrl: string;
};
export type WebhookResponse = {
    received: true;
    event: WebhookEvent;
};
export type TokenRequestContext = {
    body: TokenRequestBody;
    headers: TokenRequestHeaders;
};
export type HandlerOptions = StreamFlowServerConfig & {
    authenticateTokenRequest?: (ctx: TokenRequestContext) => Promise<Participant | null>;
    onWebhook?: (event: WebhookEvent) => void | Promise<void>;
};
export type StreamFlowHandlers = {
    handleToken: (body: TokenRequestBody, headers: TokenRequestHeaders) => Promise<TokenResponse>;
    handleWebhook: (rawBody: Buffer | string, signatureHeader: string) => Promise<WebhookResponse>;
    projectId: Promise<string>;
};
export declare function createStreamFlowHandlers(options?: HandlerOptions): StreamFlowHandlers;
