export class EmbedTokensResource {
    http;
    constructor(http) {
        this.http = http;
    }
    create(params, opts = {}) {
        return this.http.request({
            method: 'POST',
            path: '/api/v1/embed-tokens',
            body: {
                resource_type: params.resourceType,
                resource_id: params.resourceId,
                participant: {
                    name: params.participant.name,
                    role: params.participant.role,
                    user_id: params.participant.userId,
                },
                ttl_seconds: params.ttlSeconds,
            },
            idempotencyKey: opts.idempotencyKey,
        });
    }
}
