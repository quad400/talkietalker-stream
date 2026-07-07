import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js'
import { buildQuery, omitUndefined } from '../utils.js'
import type { ListResult, PaginationParams, RequestOptions } from '../types/index.js'

export interface CreateWebhookParams {
  url: string
  enabledEvents?: string[]
}

export interface UpdateWebhookParams {
  url?: string
  enabledEvents?: string[]
  status?: 'enabled' | 'disabled'
}

export interface WebhookEndpoint {
  id: string
  project_id: string
  url: string
  enabled_events: string[]
  status: string
  secret?: string
  secret_masked?: string
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  event_id: string
  event_type: string
  status: 'pending' | 'delivered' | 'failed'
  attempts?: number
  last_attempt_at?: string | null
  response_status?: number | null
  created_at?: string
}

/** Webhook endpoint registration and delivery history. */
export class WebhooksResource extends TalkieTalkerStreamResource {
  create(projectId: string, params: CreateWebhookParams, opts: RequestOptions = {}): Promise<WebhookEndpoint> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/projects/${encodeURIComponent(projectId)}/webhooks`,
      body: omitUndefined({
        url: params.url,
        enabled_events: params.enabledEvents,
      }),
      ...opts,
    })
  }

  list(projectId: string, opts: RequestOptions = {}): Promise<ListResult<WebhookEndpoint>> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/projects/${encodeURIComponent(projectId)}/webhooks`,
      ...opts,
    })
  }

  update(endpointId: string, params: UpdateWebhookParams, opts: RequestOptions = {}): Promise<WebhookEndpoint> {
    return this._makeRequest({
      method: 'PATCH',
      path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}`,
      body: omitUndefined({
        url: params.url,
        enabled_events: params.enabledEvents,
        status: params.status,
      }),
      ...opts,
    })
  }

  del(endpointId: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}`,
      ...opts,
    })
  }

  test(endpointId: string, opts: RequestOptions = {}): Promise<{ queued: boolean }> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}/test`,
      ...opts,
    })
  }

  listDeliveries(
    endpointId: string,
    params: PaginationParams = {},
    opts: RequestOptions = {},
  ): Promise<ListResult<WebhookDelivery>> {
    const query = buildQuery({ page: params.page, limit: params.limit })
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/webhooks/${encodeURIComponent(endpointId)}/deliveries${query}`,
      ...opts,
    })
  }
}
