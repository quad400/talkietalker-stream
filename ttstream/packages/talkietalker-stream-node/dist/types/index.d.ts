/** Options for constructing a {@link TalkieTalkerStream} client. */
export interface TalkieTalkerStreamConfig {
    /** Server secret key (`sk_test_` / `sk_live_`). */
    secretKey?: string;
    /** Publishable key (`pk_test_` / `pk_live_`) for browser / embed flows. */
    publishKey?: string;
    baseURL?: string;
    maxRetries?: number;
    fetchImpl?: typeof fetch;
}
/** Per-request options passed as the last argument to resource methods. */
export interface RequestOptions {
    idempotencyKey?: string;
    /** Skip the Authorization header (public endpoints only). */
    unauthenticated?: boolean;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface Pagination {
    page?: number;
    limit?: number;
    total?: number;
}
export interface ListResult<T> {
    data: T[];
    pagination?: Pagination;
}
/** Metadata from the most recent HTTP response (Stripe-style). */
export interface LastResponse {
    requestId?: string;
    statusCode: number;
}
