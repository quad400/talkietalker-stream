import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import { buildQuery, omitUndefined } from '../utils.js';
/** Per-stream chat history and moderation (`/api/v1/streams/{id}/chat/*`). */
export class ChatResource extends TalkieTalkerStreamResource {
    listHistory(streamId, params = {}, opts = {}) {
        const query = buildQuery({ before: params.before, limit: params.limit });
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/history${query}`,
            ...opts,
        });
    }
    deleteMessage(streamId, messageId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}`,
            ...opts,
        });
    }
    pinMessage(streamId, messageId, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}/pin`,
            ...opts,
        });
    }
    unpinMessage(streamId, messageId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}/pin`,
            ...opts,
        });
    }
    banUser(streamId, userId, params = {}, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/ban/${encodeURIComponent(userId)}`,
            body: omitUndefined({ reason: params.reason }),
            ...opts,
        });
    }
    unbanUser(streamId, userId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/ban/${encodeURIComponent(userId)}`,
            ...opts,
        });
    }
    listModerators(streamId, opts = {}) {
        return this._makeRequest({
            method: 'GET',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators`,
            ...opts,
        });
    }
    addModerator(streamId, params, opts = {}) {
        return this._makeRequest({
            method: 'POST',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators`,
            body: { user_id: params.userId },
            ...opts,
        });
    }
    removeModerator(streamId, moderatorId, opts = {}) {
        return this._makeRequest({
            method: 'DELETE',
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators/${encodeURIComponent(moderatorId)}`,
            ...opts,
        });
    }
    /** WebSocket URL for live chat (pass JWT as `token` query param). */
    websocketUrl(baseURL, streamId, token) {
        const base = baseURL.replace(/\/$/, '');
        const qs = new URLSearchParams({ token });
        return `${base}/api/v1/streams/${encodeURIComponent(streamId)}/chat/ws?${qs}`;
    }
}
