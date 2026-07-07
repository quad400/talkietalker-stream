import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { ListResult, RequestOptions } from '../types/index.js';
export interface CreateProjectParams {
    name: string;
    slug: string;
    environment?: 'sandbox' | 'production';
    allowedOrigins?: string[];
}
export interface UpdateProjectParams {
    name: string;
    allowedOrigins?: string[];
}
export interface Project {
    id: string;
    owner_user_id: string;
    name: string;
    slug: string;
    environment: string;
    allowed_origins?: string[];
    created_at: string;
    updated_at: string;
}
export interface APIKey {
    id: string;
    project_id: string;
    name: string;
    prefix?: string;
    scopes?: ('streams:read' | 'streams:write')[];
    last_used_at?: string | null;
    expires_at?: string | null;
    revoked_at?: string | null;
    created_at?: string;
}
export interface CreateAPIKeyParams {
    name: string;
    scopes: ('streams:read' | 'streams:write')[];
    expiresAt?: string | null;
}
export interface APIKeyCreateResponse extends APIKey {
    secret: string;
}
/** API keys scoped to a project (`/api/v1/projects/{id}/api-keys`). */
export declare class ProjectAPIKeysResource extends TalkieTalkerStreamResource {
    list(projectId: string, opts?: RequestOptions): Promise<ListResult<APIKey>>;
    create(projectId: string, params: CreateAPIKeyParams, opts?: RequestOptions): Promise<APIKeyCreateResponse>;
    revoke(projectId: string, keyId: string, opts?: RequestOptions): Promise<APIKey>;
}
/** Project management (`/api/v1/projects`). Requires JWT via dashboard or secret key. */
export declare class ProjectsResource extends TalkieTalkerStreamResource {
    readonly apiKeys: ProjectAPIKeysResource;
    constructor(http: ConstructorParameters<typeof TalkieTalkerStreamResource>[0]);
    create(params: CreateProjectParams, opts?: RequestOptions): Promise<Project>;
    list(opts?: RequestOptions): Promise<ListResult<Project>>;
    retrieve(id: string, opts?: RequestOptions): Promise<Project>;
    /** @deprecated Use `retrieve` */
    get(id: string, opts?: RequestOptions): Promise<Project>;
    update(id: string, params: UpdateProjectParams, opts?: RequestOptions): Promise<Project>;
    del(id: string, opts?: RequestOptions): Promise<void>;
}
