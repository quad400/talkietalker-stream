import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { omitUndefined } from '../utils.js';
/** Mint short-lived JWTs for embedded room participants (`/api/v1/embed-tokens`). */
export class EmbedTokensResource extends TalkieTalkerStreamResource {
    create(params, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: '/api/v1/embed-tokens',
            body: omitUndefined({
                resource_type: params.resourceType,
                resource_id: params.resourceId,
                participant: omitUndefined({
                    name: params.participant.name,
                    role: params.participant.role,
                    user_id: params.participant.userId,
                }),
                ttl_seconds: params.ttlSeconds,
            }),
            ...opts,
        });
    }
}
