import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { buildQuery, omitUndefined } from '../utils.js';
function toCreateBody(params) {
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
    });
}
function toUpdateBody(params) {
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
    });
}
/**
 * Stream lifecycle and playback (`/api/v1/streams`).
 * Maps to OpenAPI `Streams` tag.
 */
export class StreamsResource extends TalkieTalkerStreamResource {
    /** Create a new stream in `idle` state. */
    create(params, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: '/api/v1/streams',
            body: toCreateBody(params),
            ...opts,
        });
    }
    list(params = {}, opts = {}) {
        const query = buildQuery({ status: params.status, page: params.page, limit: params.limit });
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams${query}`,
            ...opts,
        });
    }
    listLive(params = {}, opts = {}) {
        const query = buildQuery({ page: params.page, limit: params.limit });
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams/live${query}`,
            unauthenticated: true,
            ...opts,
        });
    }
    retrieve(id, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams/${encodeURIComponent(id)}`,
            unauthenticated: true,
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
            path: `/api/v1/streams/${encodeURIComponent(id)}`,
            body: toUpdateBody(params),
            ...opts,
        });
    }
    del(id, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/streams/${encodeURIComponent(id)}`,
            ...opts,
        });
    }
    start(id, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(id)}/start`,
            ...opts,
        });
    }
    stop(id, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(id)}/stop`,
            ...opts,
        });
    }
    rotateKey(id, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(id)}/rotate-key`,
            ...opts,
        });
    }
    watch(id, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams/${encodeURIComponent(id)}/watch`,
            ...opts,
        });
    }
}
