import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js';
export type RecordingStatus = 'processing' | 'ready' | 'failed';
export interface Recording {
    id: string;
    stream_id: string;
    stream_title?: string;
    file_url?: string;
    duration_seconds?: number;
    file_size_bytes?: number;
    status: RecordingStatus;
    created_at?: string;
}
export interface RecordingByStream {
    id: string;
    stream_id: string;
    file_url?: string;
    duration_seconds?: number;
    file_size_bytes?: number;
    status: RecordingStatus;
    created_at?: string;
}
export interface UpdateRecordingParams {
    status?: RecordingStatus;
    fileUrl?: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
}
export interface RecordingDownload {
    download_url: string;
    expires_at?: string;
}
export interface ListRecordingsParams extends PaginationParams {
    status?: RecordingStatus;
}
/** Host recording management (`/api/v1/recordings`). Returns direct (non-envelope) responses. */
export declare class RecordingsResource extends TalkieTalkerStreamResource {
    list(params?: ListRecordingsParams, opts?: RequestOptions): Promise<ListResult<Recording>>;
    retrieve(id: string, opts?: RequestOptions): Promise<Recording>;
    retrieveByStream(streamId: string, opts?: RequestOptions): Promise<RecordingByStream>;
    update(id: string, params: UpdateRecordingParams, opts?: RequestOptions): Promise<{
        id: string;
        status?: RecordingStatus;
        updated_at?: string;
    }>;
    del(id: string, opts?: RequestOptions): Promise<void>;
    download(id: string, opts?: RequestOptions): Promise<RecordingDownload>;
}
