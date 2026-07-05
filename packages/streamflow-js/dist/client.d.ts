import { EmbedTokensResource } from './resources/embed-tokens.js';
import { ProjectsResource } from './resources/projects.js';
import { StreamsResource } from './resources/streams.js';
import { WebhooksResource } from './resources/webhooks.js';
export interface StreamFlowOptions {
    apiKey?: string;
    accessToken?: string;
    baseURL?: string;
    maxRetries?: number;
    fetchImpl?: typeof fetch;
}
export declare class StreamFlow {
    readonly streams: StreamsResource;
    readonly projects: ProjectsResource;
    readonly webhooks: WebhooksResource;
    readonly embedTokens: EmbedTokensResource;
    constructor(opts: StreamFlowOptions);
}
