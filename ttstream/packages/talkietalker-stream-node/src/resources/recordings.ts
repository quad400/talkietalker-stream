import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js'
import { buildQuery, omitUndefined } from '../utils.js'
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js'

export type RecordingStatus = 'processing' | 'ready' | 'failed'

export interface Recording {
  id: string
  stream_id: string
  stream_title?: string
  file_url?: string
  duration_seconds?: number
  file_size_bytes?: number
  status: RecordingStatus
  created_at?: string
}

export interface RecordingByStream {
  id: string
  stream_id: string
  file_url?: string
  duration_seconds?: number
  file_size_bytes?: number
  status: RecordingStatus
  created_at?: string
}

export interface UpdateRecordingParams {
  status?: RecordingStatus
  fileUrl?: string
  durationSeconds?: number
  fileSizeBytes?: number
}

export interface RecordingDownload {
  download_url: string
  expires_at?: string
}

export interface ListRecordingsParams extends PaginationParams {
  status?: RecordingStatus
}

/** Host recording management (`/api/v1/recordings`). Returns direct (non-envelope) responses. */
export class RecordingsResource extends TalkieTalkerStreamResource {
  list(params: ListRecordingsParams = {}, opts: RequestOptions = {}): Promise<ListResult<Recording>> {
    const query = buildQuery({ status: params.status, page: params.page, limit: params.limit })
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/recordings${query}`,
      ...opts,
    })
  }

  retrieve(id: string, opts: RequestOptions = {}): Promise<Recording> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/recordings/${encodeURIComponent(id)}`,
      ...opts,
    })
  }

  retrieveByStream(streamId: string, opts: RequestOptions = {}): Promise<RecordingByStream> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/recordings/stream/${encodeURIComponent(streamId)}`,
      ...opts,
    })
  }

  update(
    id: string,
    params: UpdateRecordingParams,
    opts: RequestOptions = {},
  ): Promise<{ id: string; status?: RecordingStatus; updated_at?: string }> {
    return this._makeRequest({
      method: 'PATCH',
      path: `/api/v1/recordings/${encodeURIComponent(id)}`,
      body: omitUndefined({
        status: params.status,
        file_url: params.fileUrl,
        duration_seconds: params.durationSeconds,
        file_size_bytes: params.fileSizeBytes,
      }),
      ...opts,
    })
  }

  del(id: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/recordings/${encodeURIComponent(id)}`,
      ...opts,
    })
  }

  download(id: string, opts: RequestOptions = {}): Promise<RecordingDownload> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/recordings/${encodeURIComponent(id)}/download`,
      ...opts,
    })
  }
}
