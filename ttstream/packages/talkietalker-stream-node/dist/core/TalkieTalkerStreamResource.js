/**
 * Base class for API resource namespaces (`streams`, `projects`, etc.).
 * Subclasses call `_makeRequest` with method, path, and body.
 */
export class TalkieTalkerStreamResource {
    http;
    constructor(http) {
        this.http = http;
    }
    _makeRequest(opts) {
        return this.http.request({
            method: opts.method,
            path: opts.path,
            body: opts.body,
            idempotencyKey: opts.idempotencyKey,
            unauthenticated: opts.unauthenticated,
        });
    }
}
