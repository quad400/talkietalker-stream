import type { HttpClient } from '../http.js';
export interface CreateWebhookParams {
    url: string;
    enabledEvents?: string[];
}
export interface WebhookEndpoint {
    id: string;
    project_id: string;
    url: string;
    enabled_events: string[];
    status: string;
    secret?: string;
    secret_masked?: string;
    created_at: string;
    updated_at: string;
}
export interface RequestOpts {
    idempotencyKey?: string;
}
export declare class WebhooksResource {
    private readonly http;
    constructor(http: HttpClient);
    create(projectId: string, params: CreateWebhookParams, opts?: RequestOpts): Promise<WebhookEndpoint>;
    list(projectId: string): Promise<{
        data: WebhookEndpoint[];
    }>;
    test(endpointId: string): Promise<{
        queued: boolean;
    }>;
}
