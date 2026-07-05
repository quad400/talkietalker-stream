import type { HttpClient } from '../http.js'

export interface CreateWebhookParams {
  url: string
  enabledEvents?: string[]
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

export interface RequestOpts {
  idempotencyKey?: string
}

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  create(projectId: string, params: CreateWebhookParams, opts: RequestOpts = {}): Promise<WebhookEndpoint> {
    return this.http.request<WebhookEndpoint>({
      method: 'POST',
      path: `/api/v1/projects/${projectId}/webhooks`,
      body: {
        url: params.url,
        enabled_events: params.enabledEvents,
      },
      idempotencyKey: opts.idempotencyKey,
    })
  }

  list(projectId: string): Promise<{ data: WebhookEndpoint[] }> {
    return this.http.request<{ data: WebhookEndpoint[] }>({
      method: 'GET',
      path: `/api/v1/projects/${projectId}/webhooks`,
    })
  }

  test(endpointId: string): Promise<{ queued: boolean }> {
    return this.http.request<{ queued: boolean }>({
      method: 'POST',
      path: `/api/v1/webhooks/${endpointId}/test`,
    })
  }
}
