import type { HttpClient } from '../http.js';
export type StreamMode = 'broadcast' | 'room';
export type StreamVisibility = 'public' | 'private';
export interface CreateStreamParams {
    title: string;
    description?: string;
    mode?: StreamMode;
    visibility?: StreamVisibility;
    isPaid?: boolean;
    price?: number;
    currency?: string;
    isRecordingEnabled?: boolean;
}
export interface Stream {
    id: string;
    user_id: string;
    title: string;
    status: string;
    stream_key?: string;
    mode?: string;
    visibility?: string;
    created_at?: string;
}
export interface RequestOpts {
    idempotencyKey?: string;
}
export declare class StreamsResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateStreamParams, opts?: RequestOpts): Promise<Stream>;
    get(id: string): Promise<Stream>;
    list(): Promise<{
        data: Stream[];
    }>;
}
