export class TalkieTalkerStreamError extends Error {
    statusCode;
    code;
    requestId;
    constructor({ message, statusCode, code, requestId }) {
        const suffix = requestId ? ` (request_id: ${requestId})` : '';
        super(`${message}${suffix}`);
        this.name = 'TalkieTalkerStreamError';
        this.statusCode = statusCode;
        this.code = code;
        this.requestId = requestId;
    }
}
export class RateLimitError extends TalkieTalkerStreamError {
    retryAfter;
    constructor(opts) {
        super(opts);
        this.name = 'RateLimitError';
        this.retryAfter = opts.retryAfter;
    }
}
export class ValidationError extends TalkieTalkerStreamError {
    constructor(opts) {
        super(opts);
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends TalkieTalkerStreamError {
    constructor(opts) {
        super(opts);
        this.name = 'AuthenticationError';
    }
}
export class NotFoundError extends TalkieTalkerStreamError {
    constructor(opts) {
        super(opts);
        this.name = 'NotFoundError';
    }
}
export function parseError(status, body, headerRequestId) {
    const record = (typeof body === 'object' && body !== null ? body : {});
    let code = typeof record.code === 'string' ? record.code : undefined;
    let message = '';
    let requestId = typeof record.request_id === 'string' ? record.request_id : headerRequestId;
    if (typeof record.error === 'string') {
        message = record.error;
    }
    else if (typeof record.error === 'object' && record.error !== null) {
        const nested = record.error;
        if (typeof nested.code === 'string')
            code = nested.code;
        if (typeof nested.message === 'string')
            message = nested.message;
    }
    if (!message)
        message = `Request failed with status ${status}`;
    const base = { message, statusCode: status, code, requestId };
    if (status === 429 || code === 'rate_limited')
        return new RateLimitError(base);
    if (status === 400 || code === 'validation_error')
        return new ValidationError(base);
    if (status === 401 || code === 'unauthorized')
        return new AuthenticationError(base);
    if (status === 404 || code === 'not_found')
        return new NotFoundError(base);
    return new TalkieTalkerStreamError(base);
}
