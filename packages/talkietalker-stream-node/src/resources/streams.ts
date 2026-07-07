import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js'
import { buildQuery, omitUndefined } from '../utils.js'
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js'

export type StreamMode = 'broadcast' | 'room'
export type StreamVisibility = 'public' | 'private'
export type StreamStatus = 'idle' | 'live' | 'ended'
export type StreamAccessType = 'free' | 'one_time_payment' | 'subscription_required'

export interface CreateStreamParams {
  title: string
  description?: string
  mode?: StreamMode
  visibility?: StreamVisibility
  isPaid?: boolean
  price?: number
  currency?: string
  accessType?: StreamAccessType
  isRecordingEnabled?: boolean
  thumbnailUrl?: string
}

export interface UpdateStreamParams {
  title?: string
  description?: string
  visibility?: StreamVisibility
  isPaid?: boolean
  price?: number
  currency?: string
  accessType?: StreamAccessType
  isRecordingEnabled?: boolean
  thumbnailUrl?: string
}

export interface StreamCreated {
  id: string
  user_id: string
  title: string
  status: StreamStatus
  stream_key?: string
  rtmp_ingest_url?: string
  playback_url?: string
  is_paid?: boolean
  price?: number | null
  currency?: string
  access_type?: StreamAccessType
  is_recording_enabled?: boolean
  mode?: StreamMode
  created_at?: string
}

export interface StreamListItem {
  id: string
  title: string
  status: StreamStatus
  is_paid?: boolean
  visibility?: StreamVisibility
  started_at?: string | null
  ended_at?: string | null
  created_at?: string
}

export interface StreamDetail {
  id: string
  user_id?: string
  host_username?: string
  title: string
  description?: string
  status: StreamStatus
  playback_url?: string
  is_paid?: boolean
  price?: number | null
  currency?: string
  access_type?: StreamAccessType
  is_recording_enabled?: boolean
  thumbnail_url?: string
  visibility?: StreamVisibility
  viewer_count?: number
  mode?: StreamMode
  started_at?: string | null
  ended_at?: string | null
  created_at?: string
}

export interface LiveStreamItem {
  id: string
  title: string
  host_username?: string
  thumbnail_url?: string
  is_paid?: boolean
  price?: number | null
  viewer_count?: number
  started_at?: string
}

export interface StreamStarted {
  id: string
  status: string
  started_at?: string
  rtmp_ingest_url?: string
  playback_url?: string
}

export interface StreamStopped {
  id: string
  status: string
  ended_at?: string
  recording_url?: string
}

export interface StreamKeyRotated {
  stream_key: string
  rtmp_ingest_url: string
}

export interface WatchResponse {
  playback_url?: string
  access_type?: 'free' | 'purchased' | 'subscribed' | 'comped'
}

export interface ListStreamsParams extends PaginationParams {
  status?: StreamStatus
}

function toCreateBody(params: CreateStreamParams): Record<string, unknown> {
  return omitUndefined({
    title: params.title,
    description: params.description,
    mode: params.mode,
    visibility: params.visibility,
    is_paid: params.isPaid,
    price: params.price,
    currency: params.currency,
    access_type: params.accessType,
    is_recording_enabled: params.isRecordingEnabled,
    thumbnail_url: params.thumbnailUrl,
  })
}

function toUpdateBody(params: UpdateStreamParams): Record<string, unknown> {
  return omitUndefined({
    title: params.title,
    description: params.description,
    visibility: params.visibility,
    is_paid: params.isPaid,
    price: params.price,
    currency: params.currency,
    access_type: params.accessType,
    is_recording_enabled: params.isRecordingEnabled,
    thumbnail_url: params.thumbnailUrl,
  })
}

/**
 * Stream lifecycle and playback (`/api/v1/streams`).
 * Maps to OpenAPI `Streams` tag.
 */
export class StreamsResource extends TalkieTalkerStreamResource {
  /** Create a new stream in `idle` state. */
  create(params: CreateStreamParams, opts: RequestOptions = {}): Promise<StreamCreated> {
    return this._makeRequest({
      method: 'POST',
      path: '/api/v1/streams',
      body: toCreateBody(params),
      ...opts,
    })
  }

  list(params: ListStreamsParams = {}, opts: RequestOptions = {}): Promise<ListResult<StreamListItem>> {
    const query = buildQuery({ status: params.status, page: params.page, limit: params.limit })
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams${query}`,
      ...opts,
    })
  }

  listLive(params: PaginationParams = {}, opts: RequestOptions = {}): Promise<ListResult<LiveStreamItem>> {
    const query = buildQuery({ page: params.page, limit: params.limit })
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams/live${query}`,
      unauthenticated: true,
      ...opts,
    })
  }

  retrieve(id: string, opts: RequestOptions = {}): Promise<StreamDetail> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams/${encodeURIComponent(id)}`,
      unauthenticated: true,
      ...opts,
    })
  }

  /** @deprecated Use `retrieve` */
  get(id: string, opts?: RequestOptions): Promise<StreamDetail> {
    return this.retrieve(id, opts)
  }

  update(id: string, params: UpdateStreamParams, opts: RequestOptions = {}): Promise<{ id: string; title?: string; updated_at?: string }> {
    return this._makeRequest({
      method: 'PATCH',
      path: `/api/v1/streams/${encodeURIComponent(id)}`,
      body: toUpdateBody(params),
      ...opts,
    })
  }

  del(id: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/streams/${encodeURIComponent(id)}`,
      ...opts,
    })
  }

  start(id: string, opts: RequestOptions = {}): Promise<StreamStarted> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(id)}/start`,
      ...opts,
    })
  }

  stop(id: string, opts: RequestOptions = {}): Promise<StreamStopped> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(id)}/stop`,
      ...opts,
    })
  }

  rotateKey(id: string, opts: RequestOptions = {}): Promise<StreamKeyRotated> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(id)}/rotate-key`,
      ...opts,
    })
  }

  watch(id: string, opts: RequestOptions = {}): Promise<WatchResponse> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams/${encodeURIComponent(id)}/watch`,
      ...opts,
    })
  }
}
