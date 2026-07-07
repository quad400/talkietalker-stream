import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js'
import { omitUndefined } from '../utils.js'
import type { ListResult, RequestOptions } from '../types/index.js'

export interface CreateProjectParams {
  name: string
  slug: string
  environment?: 'sandbox' | 'production'
  allowedOrigins?: string[]
}

export interface UpdateProjectParams {
  name: string
  allowedOrigins?: string[]
}

export interface Project {
  id: string
  owner_user_id: string
  name: string
  slug: string
  environment: string
  allowed_origins?: string[]
  created_at: string
  updated_at: string
}

export interface APIKey {
  id: string
  project_id: string
  name: string
  prefix?: string
  scopes?: ('streams:read' | 'streams:write')[]
  last_used_at?: string | null
  expires_at?: string | null
  revoked_at?: string | null
  created_at?: string
}

export interface CreateAPIKeyParams {
  name: string
  scopes: ('streams:read' | 'streams:write')[]
  expiresAt?: string | null
}

export interface APIKeyCreateResponse extends APIKey {
  secret: string
}

/** API keys scoped to a project (`/api/v1/projects/{id}/api-keys`). */
export class ProjectAPIKeysResource extends TalkieTalkerStreamResource {
  list(projectId: string, opts: RequestOptions = {}): Promise<ListResult<APIKey>> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
      ...opts,
    })
  }

  create(
    projectId: string,
    params: CreateAPIKeyParams,
    opts: RequestOptions = {},
  ): Promise<APIKeyCreateResponse> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
      body: omitUndefined({
        name: params.name,
        scopes: params.scopes,
        expires_at: params.expiresAt,
      }),
      ...opts,
    })
  }

  revoke(projectId: string, keyId: string, opts: RequestOptions = {}): Promise<APIKey> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys/${encodeURIComponent(keyId)}`,
      ...opts,
    })
  }
}

/** Project management (`/api/v1/projects`). Requires JWT via dashboard or secret key. */
export class ProjectsResource extends TalkieTalkerStreamResource {
  readonly apiKeys: ProjectAPIKeysResource

  constructor(http: ConstructorParameters<typeof TalkieTalkerStreamResource>[0]) {
    super(http)
    this.apiKeys = new ProjectAPIKeysResource(http)
  }

  create(params: CreateProjectParams, opts: RequestOptions = {}): Promise<Project> {
    return this._makeRequest({
      method: 'POST',
      path: '/api/v1/projects',
      body: omitUndefined({
        name: params.name,
        slug: params.slug,
        environment: params.environment,
        allowed_origins: params.allowedOrigins,
      }),
      ...opts,
    })
  }

  list(opts: RequestOptions = {}): Promise<ListResult<Project>> {
    return this._makeRequest({
      method: 'GET',
      path: '/api/v1/projects',
      ...opts,
    })
  }

  retrieve(id: string, opts: RequestOptions = {}): Promise<Project> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/projects/${encodeURIComponent(id)}`,
      ...opts,
    })
  }

  /** @deprecated Use `retrieve` */
  get(id: string, opts?: RequestOptions): Promise<Project> {
    return this.retrieve(id, opts)
  }

  update(id: string, params: UpdateProjectParams, opts: RequestOptions = {}): Promise<Project> {
    return this._makeRequest({
      method: 'PATCH',
      path: `/api/v1/projects/${encodeURIComponent(id)}`,
      body: omitUndefined({
        name: params.name,
        allowed_origins: params.allowedOrigins,
      }),
      ...opts,
    })
  }

  del(id: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/projects/${encodeURIComponent(id)}`,
      ...opts,
    })
  }
}
