import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { buildQuery, omitUndefined } from '../utils.js';
/** Webhook endpoint registration and delivery history. */
export class WebhooksResource extends TalkieTalkerStreamResource {
    create(projectId, params, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/projects/${encodeURIComponent(projectId)}/webhooks`,
            body: omitUndefined({
                url: params.url,
                enabled_events: params.enabledEvents,
            }),
            ...opts,
        });
    }
    list(projectId, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/projects/${encodeURIComponent(projectId)}/webhooks`,
            ...opts,
        });
    }
    update(endpointId, params, opts = {}) {
        return this._makeRequest({
            method: 'PATCH',
            path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}`,
            body: omitUndefined({
                url: params.url,
                enabled_events: params.enabledEvents,
                status: params.status,
            }),
            ...opts,
        });
    }
    del(endpointId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}`,
            ...opts,
        });
    }
    test(endpointId, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}/test`,
            ...opts,
        });
    }
    listDeliveries(endpointId, params = {}, opts = {}) {
        const query = buildQuery({ page: params.page, limit: params.limit });
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}/deliveries${query}`,
            ...opts,
        });
    }
}
