import { resolveClientConfig } from './config/client.js';
import { HttpClient } from './core/HttpClient.js';
import { ChatResource } from './resources/chat.js';
import { EmbedTokensResource } from './resources/embed-tokens.js';
import { ProjectsResource } from './resources/projects.js';
import { RecordingsResource } from './resources/recordings.js';
import { StreamsResource } from './resources/streams.js';
import { WebhooksResource } from './resources/webhooks.js';
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
export class TalkieTalkerStream {
    streams;
    projects;
    webhooks;
    recordings;
    chat;
    embedTokens;
    secretKey;
    publishKey;
    http;
    constructor(opts = {}) {
        const config = resolveClientConfig(opts);
        this.secretKey = config.secretKey;
        this.publishKey = config.publishKey;
        this.http = new HttpClient(config);
        this.streams = new StreamsResource(this.http);
        this.projects = new ProjectsResource(this.http);
        this.webhooks = new WebhooksResource(this.http);
        this.recordings = new RecordingsResource(this.http);
        this.chat = new ChatResource(this.http);
        this.embedTokens = new EmbedTokensResource(this.http);
    }
    /** REST API base URL (also used to build WebSocket URLs). */
    get baseURL() {
        return this.http.baseURL;
    }
}
