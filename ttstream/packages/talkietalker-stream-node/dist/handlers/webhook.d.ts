import type { ServerConfig } from '../config/server.js';
import type { HandlerOptions, WebhookResponse } from './types.js';
/**
 * Handle `POST /webhooks` — verify signature and optionally dispatch to `onWebhook`.
 * Requires `TALKIETALKER_STREAM_WEBHOOK_SECRET` in server config.
 */
export declare function handleWebhookRequest(config: ServerConfig, options: HandlerOptions, rawBody: Buffer | string, signatureHeader: string): Promise<WebhookResponse>;
