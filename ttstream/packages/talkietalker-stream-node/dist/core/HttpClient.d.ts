export interface HttpClientOptions {
    secretKey: string;
    baseURL: string;
    maxRetries?: number;
    fetchImpl?: typeof fetch;
}
/** Low-level HTTP transport — auth, retries, envelope unwrap. Not used directly by SDK consumers. */
export interface HttpRequestOptions {
    method: string;
    path: string;
    body?: unknown;
    idempotencyKey?: string;
    unauthenticated?: boolean;
}
/**
 * Internal HTTP client for all REST resources.
 * Authenticates with `secretKey` and unwraps `{ status, data }` envelopes.
 */
export declare class HttpClient {
    private readonly secretKey;
    private readonly maxRetries;
    private readonly fetchImpl;
    readonly baseURL: string;
    constructor(opts: HttpClientOptions);
    /** Execute a request with automatic retry on 429 rate limits. */
    request<T>(opts: HttpRequestOptions): Promise<T>;
    private doRequest;
}
