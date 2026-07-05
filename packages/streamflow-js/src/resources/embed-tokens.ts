import type { HttpClient } from '../http.js'

export interface CreateEmbedTokenParams {
  resourceType: 'room'
  resourceId: string
  participant: {
    name: string
    role?: string
    userId?: string
  }
  ttlSeconds?: number
}

export interface EmbedToken {
  token: string
  expires_at: string
}

export interface RequestOpts {
  idempotencyKey?: string
}

export class EmbedTokensResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateEmbedTokenParams, opts: RequestOpts = {}): Promise<EmbedToken> {
    return this.http.request<EmbedToken>({
      method: 'POST',
      path: '/api/v1/embed-tokens',
      body: {
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        participant: {
          name: params.participant.name,
          role: params.participant.role,
          user_id: params.participant.userId,
        },
        ttl_seconds: params.ttlSeconds,
      },
      idempotencyKey: opts.idempotencyKey,
    })
  }
}
