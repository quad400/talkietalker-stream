import type { Participant } from '../server/mint-embed-token.js';
import type { WebhookEvent } from '../webhooks/verify.js';
import type { TalkieTalkerStreamServerConfig } from '../config/server.js';
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
export type HandlerOptions = TalkieTalkerStreamServerConfig & {
    /** Override default participant resolution for embed token requests. */
    authenticateTokenRequest?: (ctx: TokenRequestContext) => Promise<Participant | null>;
    /** Called after webhook signature verification succeeds. */
    onWebhook?: (event: WebhookEvent) => void | Promise<void>;
};
export type TalkieTalkerStreamHandlers = {
    handleToken: (body: TokenRequestBody, headers: TokenRequestHeaders) => Promise<TokenResponse>;
    handleWebhook: (rawBody: Buffer | string, signatureHeader: string) => Promise<WebhookResponse>;
    projectId: Promise<string>;
};
