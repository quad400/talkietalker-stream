export interface HttpClientOptions {
    apiKey?: string;
    accessToken?: string;
    baseURL?: string;
    maxRetries?: number;
    fetchImpl?: typeof fetch;
}
export interface RequestOptions {
    method: string;
    path: string;
    body?: unknown;
    idempotencyKey?: string;
    useJWT?: boolean;
}
export declare class HttpClient {
    private readonly apiKey?;
    private readonly accessToken?;
    private readonly baseURL;
    private readonly maxRetries;
    private readonly fetchImpl;
    constructor(opts: HttpClientOptions);
    request<T>(opts: RequestOptions): Promise<T>;
    private doRequest;
}
