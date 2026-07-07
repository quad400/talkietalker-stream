import type { HandlerOptions, TalkieTalkerStreamHandlers } from './types.js';
/**
 * Create framework-agnostic handlers for embed token minting and webhook ingestion.
 * Wire these into Express, Fastify, or Next.js via the `@talkietalker/stream-sdk/*` adapters.
 */
export declare function createTalkieTalkerStreamHandlers(options?: HandlerOptions): TalkieTalkerStreamHandlers;
