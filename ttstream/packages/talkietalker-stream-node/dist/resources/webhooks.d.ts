import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js';
export interface CreateWebhookParams {
    url: string;
    enabledEvents?: string[];
}
export interface UpdateWebhookParams {
    url?: string;
    enabledEvents?: string[];
    status?: 'enabled' | 'disabled';
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
export interface WebhookDelivery {
    id: string;
    event_id: string;
    event_type: string;
    status: 'pending' | 'delivered' | 'failed';
    attempts?: number;
    last_attempt_at?: string | null;
    response_status?: number | null;
    created_at?: string;
}
/** Webhook endpoint registration and delivery history. */
export declare class WebhooksResource extends TalkieTalkerStreamResource {
    create(projectId: string, params: CreateWebhookParams, opts?: RequestOptions): Promise<WebhookEndpoint>;
    list(projectId: string, opts?: RequestOptions): Promise<ListResult<WebhookEndpoint>>;
    update(endpointId: string, params: UpdateWebhookParams, opts?: RequestOptions): Promise<WebhookEndpoint>;
    del(endpointId: string, opts?: RequestOptions): Promise<void>;
    test(endpointId: string, opts?: RequestOptions): Promise<{
        queued: boolean;
    }>;
    listDeliveries(endpointId: string, params?: PaginationParams, opts?: RequestOptions): Promise<ListResult<WebhookDelivery>>;
}
