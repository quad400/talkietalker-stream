export class WebhooksResource {
    http;
    constructor(http) {
        this.http = http;
    }
    create(projectId, params, opts = {}) {
        return this.http.request({
            method: 'POST',
            path: `/api/v1/projects/${projectId}/webhooks`,
            body: {
                url: params.url,
                enabled_events: params.enabledEvents,
            },
            idempotencyKey: opts.idempotencyKey,
        });
    }
    list(projectId) {
        return this.http.request({
            method: 'GET',
            path: `/api/v1/projects/${projectId}/webhooks`,
        });
    }
    test(endpointId) {
        return this.http.request({
            method: 'POST',
            path: `/api/v1/webhooks/${endpointId}/test`,
        });
    }
}
