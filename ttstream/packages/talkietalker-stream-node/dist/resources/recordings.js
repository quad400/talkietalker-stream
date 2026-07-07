import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { buildQuery, omitUndefined } from '../utils.js';
/** Host recording management (`/api/v1/recordings`). Returns direct (non-envelope) responses. */
export class RecordingsResource extends TalkieTalkerStreamResource {
    list(params = {}, opts = {}) {
        const query = buildQuery({ status: params.status, page: params.page, limit: params.limit });
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/recordings${query}`,
            ...opts,
        });
    }
    retrieve(id, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/recordings/${encodeURIComponent(id)}`,
            ...opts,
        });
    }
    retrieveByStream(streamId, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/recordings/stream/${encodeURIComponent(streamId)}`,
            ...opts,
        });
    }
    update(id, params, opts = {}) {
        return this._makeRequest({
            method: 'PATCH',
            path: `/api/v1/recordings/${encodeURIComponent(id)}`,
            body: omitUndefined({
                status: params.status,
                file_url: params.fileUrl,
                duration_seconds: params.durationSeconds,
                file_size_bytes: params.fileSizeBytes,
            }),
            ...opts,
        });
    }
    del(id, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/recordings/${encodeURIComponent(id)}`,
            ...opts,
        });
    }
    download(id, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/recordings/${encodeURIComponent(id)}/download`,
            ...opts,
        });
    }
}
