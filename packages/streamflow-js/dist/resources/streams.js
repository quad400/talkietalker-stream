function toBody(params) {
    return {
        title: params.title,
        description: params.description,
        mode: params.mode,
        visibility: params.visibility,
        is_paid: params.isPaid,
        price: params.price,
        currency: params.currency,
        is_recording_enabled: params.isRecordingEnabled,
    };
}
export class StreamsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    create(params, opts = {}) {
        return this.http.request({
            method: 'POST',
            path: '/api/v1/streams',
            body: toBody(params),
            idempotencyKey: opts.idempotencyKey,
        });
    }
    get(id) {
        return this.http.request({ method: 'GET', path: `/api/v1/streams/${id}` });
    }
    list() {
        return this.http.request({ method: 'GET', path: '/api/v1/streams' });
    }
}
