import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js';
export type StreamMode = 'broadcast' | 'room';
export type StreamVisibility = 'public' | 'private';
export type StreamStatus = 'idle' | 'live' | 'ended';
export type StreamAccessType = 'free' | 'one_time_payment' | 'subscription_required';
export interface CreateStreamParams {
    title: string;
    description?: string;
    mode?: StreamMode;
    visibility?: StreamVisibility;
    isPaid?: boolean;
    price?: number;
    currency?: string;
    accessType?: StreamAccessType;
    isRecordingEnabled?: boolean;
    thumbnailUrl?: string;
}
export interface UpdateStreamParams {
    title?: string;
    description?: string;
    visibility?: StreamVisibility;
    isPaid?: boolean;
    price?: number;
    currency?: string;
    accessType?: StreamAccessType;
    isRecordingEnabled?: boolean;
    thumbnailUrl?: string;
}
export interface StreamCreated {
    id: string;
    user_id: string;
    title: string;
    status: StreamStatus;
    stream_key?: string;
    rtmp_ingest_url?: string;
    playback_url?: string;
    is_paid?: boolean;
    price?: number | null;
    currency?: string;
    access_type?: StreamAccessType;
    is_recording_enabled?: boolean;
    mode?: StreamMode;
    created_at?: string;
}
export interface StreamListItem {
    id: string;
    title: string;
    status: StreamStatus;
    is_paid?: boolean;
    visibility?: StreamVisibility;
    started_at?: string | null;
    ended_at?: string | null;
    created_at?: string;
}
export interface StreamDetail {
    id: string;
    user_id?: string;
    host_username?: string;
    title: string;
    description?: string;
    status: StreamStatus;
    playback_url?: string;
    is_paid?: boolean;
    price?: number | null;
    currency?: string;
    access_type?: StreamAccessType;
    is_recording_enabled?: boolean;
    thumbnail_url?: string;
    visibility?: StreamVisibility;
    viewer_count?: number;
    mode?: StreamMode;
    started_at?: string | null;
    ended_at?: string | null;
    created_at?: string;
}
export interface LiveStreamItem {
    id: string;
    title: string;
    host_username?: string;
    thumbnail_url?: string;
    is_paid?: boolean;
    price?: number | null;
    viewer_count?: number;
    started_at?: string;
}
export interface StreamStarted {
    id: string;
    status: string;
    started_at?: string;
    rtmp_ingest_url?: string;
    playback_url?: string;
}
export interface StreamStopped {
    id: string;
    status: string;
    ended_at?: string;
    recording_url?: string;
}
export interface StreamKeyRotated {
    stream_key: string;
    rtmp_ingest_url: string;
}
export interface WatchResponse {
    playback_url?: string;
    access_type?: 'free' | 'purchased' | 'subscribed' | 'comped';
}
export interface ListStreamsParams extends PaginationParams {
    status?: StreamStatus;
}
/**
 * Stream lifecycle and playback (`/api/v1/streams`).
 * Maps to OpenAPI `Streams` tag.
 */
export declare class StreamsResource extends TalkieTalkerStreamResource {
    /** Create a new stream in `idle` state. */
    create(params: CreateStreamParams, opts?: RequestOptions): Promise<StreamCreated>;
    list(params?: ListStreamsParams, opts?: RequestOptions): Promise<ListResult<StreamListItem>>;
    listLive(params?: PaginationParams, opts?: RequestOptions): Promise<ListResult<LiveStreamItem>>;
    retrieve(id: string, opts?: RequestOptions): Promise<StreamDetail>;
    /** @deprecated Use `retrieve` */
    get(id: string, opts?: RequestOptions): Promise<StreamDetail>;
    update(id: string, params: UpdateStreamParams, opts?: RequestOptions): Promise<{
        id: string;
        title?: string;
        updated_at?: string;
    }>;
    del(id: string, opts?: RequestOptions): Promise<void>;
    start(id: string, opts?: RequestOptions): Promise<StreamStarted>;
    stop(id: string, opts?: RequestOptions): Promise<StreamStopped>;
    rotateKey(id: string, opts?: RequestOptions): Promise<StreamKeyRotated>;
    watch(id: string, opts?: RequestOptions): Promise<WatchResponse>;
}
