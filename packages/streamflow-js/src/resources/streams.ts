import type { HttpClient } from '../http.js'

export type StreamMode = 'broadcast' | 'room'
export type StreamVisibility = 'public' | 'private'

export interface CreateStreamParams {
  title: string
  description?: string
  mode?: StreamMode
  visibility?: StreamVisibility
  isPaid?: boolean
  price?: number
  currency?: string
  isRecordingEnabled?: boolean
}

export interface Stream {
  id: string
  user_id: string
  title: string
  status: string
  stream_key?: string
  mode?: string
  visibility?: string
  created_at?: string
}

export interface RequestOpts {
  idempotencyKey?: string
}

function toBody(params: CreateStreamParams): Record<string, unknown> {
  return {
    title: params.title,
    description: params.description,
    mode: params.mode,
    visibility: params.visibility,
    is_paid: params.isPaid,
    price: params.price,
    currency: params.currency,
    is_recording_enabled: params.isRecordingEnabled,
  }
}

export class StreamsResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateStreamParams, opts: RequestOpts = {}): Promise<Stream> {
    return this.http.request<Stream>({
      method: 'POST',
      path: '/api/v1/streams',
      body: toBody(params),
      idempotencyKey: opts.idempotencyKey,
    })
  }

  get(id: string): Promise<Stream> {
    return this.http.request<Stream>({ method: 'GET', path: `/api/v1/streams/${id}` })
  }

  list(): Promise<{ data: Stream[] }> {
    return this.http.request<{ data: Stream[] }>({ method: 'GET', path: '/api/v1/streams' })
  }
}
