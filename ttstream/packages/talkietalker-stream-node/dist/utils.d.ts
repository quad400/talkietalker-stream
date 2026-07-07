/** Build a URL query string from key/value pairs (skips undefined). */
export declare function buildQuery(params: Record<string, string | number | boolean | undefined>): string;
export declare function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T>;
