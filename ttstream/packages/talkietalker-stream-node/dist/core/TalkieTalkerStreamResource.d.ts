import type { HttpClient } from './HttpClient.js';
import type { RequestOptions } from '../types/index.js';
export type MakeRequestOptions = RequestOptions & {
    method: string;
    path: string;
    body?: unknown;
};
/**
 * Base class for API resource namespaces (`streams`, `projects`, etc.).
 * Subclasses call `_makeRequest` with method, path, and body.
 */
export declare class TalkieTalkerStreamResource {
    protected readonly http: HttpClient;
    constructor(http: HttpClient);
    protected _makeRequest<T>(opts: MakeRequestOptions): Promise<T>;
}
