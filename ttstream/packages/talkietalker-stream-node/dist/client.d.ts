import { ChatResource } from './resources/chat.js';
import { EmbedTokensResource } from './resources/embed-tokens.js';
import { ProjectsResource } from './resources/projects.js';
import { RecordingsResource } from './resources/recordings.js';
import { StreamsResource } from './resources/streams.js';
import { WebhooksResource } from './resources/webhooks.js';
import type { TalkieTalkerStreamConfig } from './types/index.js';
export type { TalkieTalkerStreamConfig as TalkieTalkerStreamOptions };
/**
 * TalkieTalkerStream REST API client.
 *
 * Authenticates with `secretKey` (sk_test_/sk_live_). Optionally carries
 * `publishKey` for embed flows. All resources are namespaced properties:
 * `streams`, `projects`, `webhooks`, `recordings`, `chat`, `embedTokens`.
 *
 * @example
 * ```ts
 * const sf = new TalkieTalkerStream({ secretKey: process.env.TALKIETALKER_STREAM_SECRET_KEY })
 * const stream = await sf.streams.create({ title: 'My Stream' })
 * ```
 */
export declare class TalkieTalkerStream {
    readonly streams: StreamsResource;
    readonly projects: ProjectsResource;
    readonly webhooks: WebhooksResource;
    readonly recordings: RecordingsResource;
    readonly chat: ChatResource;
    readonly embedTokens: EmbedTokensResource;
    readonly secretKey: string;
    readonly publishKey?: string;
    private readonly http;
    constructor(opts?: TalkieTalkerStreamConfig);
    /** REST API base URL (also used to build WebSocket URLs). */
    get baseURL(): string;
}
