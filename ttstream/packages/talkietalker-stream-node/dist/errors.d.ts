export interface TalkieTalkerStreamErrorOptions {
    message: string;
    statusCode?: number;
    code?: string;
    requestId?: string;
}
export declare class TalkieTalkerStreamError extends Error {
    readonly statusCode?: number;
    readonly code?: string;
    readonly requestId?: string;
    constructor({ message, statusCode, code, requestId }: TalkieTalkerStreamErrorOptions);
}
export declare class RateLimitError extends TalkieTalkerStreamError {
    retryAfter?: number;
    constructor(opts: TalkieTalkerStreamErrorOptions & {
        retryAfter?: number;
    });
}
export declare class ValidationError extends TalkieTalkerStreamError {
    constructor(opts: TalkieTalkerStreamErrorOptions);
}
export declare class AuthenticationError extends TalkieTalkerStreamError {
    constructor(opts: TalkieTalkerStreamErrorOptions);
}
export declare class NotFoundError extends TalkieTalkerStreamError {
    constructor(opts: TalkieTalkerStreamErrorOptions);
}
export declare function parseError(status: number, body: unknown, headerRequestId?: string): TalkieTalkerStreamError;
