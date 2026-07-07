import { parseError, RateLimitError } from '../errors.js';
import { attachLastResponse, unwrapBody } from './parse-response.js';
import { parseRetryAfter, sleep } from './retry.js';
/**
 * Internal HTTP client for all REST resources.
 * Authenticates with `secretKey` and unwraps `{ status, data }` envelopes.
 */
export class HttpClient {
    secretKey;
    maxRetries;
    fetchImpl;
    baseURL;
    constructor(opts) {
        this.secretKey = opts.secretKey;
        this.baseURL = opts.baseURL.replace(/\/$/, '');
        this.maxRetries = opts.maxRetries ?? 3;
        this.fetchImpl = opts.fetchImpl ?? fetch;
    }
    /** Execute a request with automatic retry on 429 rate limits. */
    async request(opts) {
        let attempt = 0;
        while (true) {
            try {
                return await this.doRequest(opts);
            }
            catch (err) {
                if (!(err instanceof RateLimitError) || attempt >= this.maxRetries)
                    throw err;
                const delay = err.retryAfter ?? Math.min(1000 * 2 ** attempt, 8000);
                attempt += 1;
                await sleep(delay);
            }
        }
    }
    async doRequest(opts) {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        if (!opts.unauthenticated) {
            headers.Authorization = `Bearer ${this.secretKey}`;
        }
        if (opts.idempotencyKey) {
            headers['Idempotency-Key'] = opts.idempotencyKey;
        }
        const response = await this.fetchImpl(`${this.baseURL}${opts.path}`, {
            method: opts.method,
            headers,
            body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        });
        const requestId = response.headers.get('X-Request-ID') ?? undefined;
        const lastResponse = { requestId, statusCode: response.status };
        if (response.status === 204) {
            return undefined;
        }
        const text = await response.text();
        const parsed = text ? JSON.parse(text) : {};
        if (!response.ok) {
            const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get('Retry-After')) : undefined;
            const err = parseError(response.status, parsed, requestId);
            if (err instanceof RateLimitError && retryAfter !== undefined) {
                err.retryAfter = retryAfter;
            }
            throw err;
        }
        return attachLastResponse(unwrapBody(parsed), lastResponse);
    }
}
