export interface StreamFlowErrorOptions {
    message: string;
    statusCode?: number;
    code?: string;
    requestId?: string;
}
export declare class StreamFlowError extends Error {
    readonly statusCode?: number;
    readonly code?: string;
    readonly requestId?: string;
    constructor({ message, statusCode, code, requestId }: StreamFlowErrorOptions);
}
export declare class RateLimitError extends StreamFlowError {
    retryAfter?: number;
    constructor(opts: StreamFlowErrorOptions & {
        retryAfter?: number;
    });
}
export declare class ValidationError extends StreamFlowError {
    constructor(opts: StreamFlowErrorOptions);
}
export declare class AuthenticationError extends StreamFlowError {
    constructor(opts: StreamFlowErrorOptions);
}
export declare class NotFoundError extends StreamFlowError {
    constructor(opts: StreamFlowErrorOptions);
}
export declare function parseError(status: number, body: unknown, headerRequestId?: string): StreamFlowError;
