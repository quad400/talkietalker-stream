/** Parse Retry-After header (seconds or HTTP-date) into milliseconds. */
export declare function parseRetryAfter(header: string | null): number | undefined;
export declare function sleep(ms: number): Promise<void>;
