import { HttpClient } from './http.js';
import { EmbedTokensResource } from './resources/embed-tokens.js';
import { ProjectsResource } from './resources/projects.js';
import { StreamsResource } from './resources/streams.js';
import { WebhooksResource } from './resources/webhooks.js';
export class StreamFlow {
    streams;
    projects;
    webhooks;
    embedTokens;
    constructor(opts) {
        const http = new HttpClient(opts);
        this.streams = new StreamsResource(http);
        this.projects = new ProjectsResource(http);
        this.webhooks = new WebhooksResource(http);
        this.embedTokens = new EmbedTokensResource(http);
    }
}
