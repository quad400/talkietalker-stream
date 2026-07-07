import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { omitUndefined } from '../utils.js';
/** API keys scoped to a project (`/api/v1/projects/{id}/api-keys`). */
export class ProjectAPIKeysResource extends TalkieTalkerStreamResource {
    list(projectId, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
            ...opts,
        });
    }
    create(projectId, params, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
            body: omitUndefined({
                name: params.name,
                scopes: params.scopes,
                expires_at: params.expiresAt,
            }),
            ...opts,
        });
    }
    revoke(projectId, keyId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/projects/${encodeURIComponent(projectId)}/api-keys/${encodeURIComponent(keyId)}`,
            ...opts,
        });
    }
}
/** Project management (`/api/v1/projects`). Requires JWT via dashboard or secret key. */
export class ProjectsResource extends TalkieTalkerStreamResource {
    apiKeys;
    constructor(http) {
        super(http);
        this.apiKeys = new ProjectAPIKeysResource(http);
    }
    create(params, opts = {}) {
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
        });
    }
    list(opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: '/api/v1/projects',
            ...opts,
        });
    }
    retrieve(id, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/projects/${encodeURIComponent(id)}`,
            ...opts,
        });
    }
    /** @deprecated Use `retrieve` */
    get(id, opts) {
        return this.retrieve(id, opts);
    }
    update(id, params, opts = {}) {
        return this._makeRequest({
            method: 'PATCH',
            path: `/api/v1/projects/${encodeURIComponent(id)}`,
            body: omitUndefined({
                name: params.name,
                allowed_origins: params.allowedOrigins,
            }),
            ...opts,
        });
    }
    del(id, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/projects/${encodeURIComponent(id)}`,
            ...opts,
        });
    }
}
