import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js'
import { buildQuery, omitUndefined } from '../utils.js'
import type { RequestOptions } from '../types/index.js'

export interface ChatMessage {
  id: string
  user_id?: string
  username?: string
  content?: string
  is_deleted?: boolean
  created_at?: string
}

export interface ChatHistoryResult {
  data: ChatMessage[]
  has_more?: boolean
}

export interface ListChatHistoryParams {
  before?: string
  limit?: number
}

export interface ChatBanParams {
  reason?: string
}

export interface ChatBanResult {
  banned_user_id?: string
  channel_user_id?: string
  reason?: string
  banned_at?: string
}

export interface ChatModerator {
  id: string
  moderator_user_id?: string
  moderator_username?: string
  granted_at?: string
}

export interface AddModeratorParams {
  userId: string
}

/** Per-stream chat history and moderation (`/api/v1/streams/{id}/chat/*`). */
export class ChatResource extends TalkieTalkerStreamResource {
  listHistory(
    streamId: string,
    params: ListChatHistoryParams = {},
    opts: RequestOptions = {},
  ): Promise<ChatHistoryResult> {
    const query = buildQuery({ before: params.before, limit: params.limit })
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/history${query}`,
      ...opts,
    })
  }

  deleteMessage(streamId: string, messageId: string, opts: RequestOptions = {}): Promise<{ id: string; is_deleted?: boolean; deleted_at?: string }> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}`,
      ...opts,
    })
  }

  pinMessage(streamId: string, messageId: string, opts: RequestOptions = {}): Promise<{ id: string }> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}/pin`,
      ...opts,
    })
  }

  unpinMessage(streamId: string, messageId: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/messages/${encodeURIComponent(messageId)}/pin`,
      ...opts,
    })
  }

  banUser(streamId: string, userId: string, params: ChatBanParams = {}, opts: RequestOptions = {}): Promise<ChatBanResult> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/ban/${encodeURIComponent(userId)}`,
      body: omitUndefined({ reason: params.reason }),
      ...opts,
    })
  }

  unbanUser(streamId: string, userId: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/ban/${encodeURIComponent(userId)}`,
      ...opts,
    })
  }

  listModerators(streamId: string, opts: RequestOptions = {}): Promise<{ data: ChatModerator[] }> {
    return this._makeRequest({
      method: 'GET',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators`,
      ...opts,
    })
  }

  addModerator(streamId: string, params: AddModeratorParams, opts: RequestOptions = {}): Promise<ChatModerator> {
    return this._makeRequest({
      method: 'POST',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators`,
      body: { user_id: params.userId },
      ...opts,
    })
  }

  removeModerator(streamId: string, moderatorId: string, opts: RequestOptions = {}): Promise<void> {
    return this._makeRequest({
      method: 'DELETE',
      path: `/api/v1/streams/${encodeURIComponent(streamId)}/chat/moderators/${encodeURIComponent(moderatorId)}`,
      ...opts,
    })
  }

  /** WebSocket URL for live chat (pass JWT as `token` query param). */
  websocketUrl(baseURL: string, streamId: string, token: string): string {
    const base = baseURL.replace(/\/$/, '')
    const qs = new URLSearchParams({ token })
    return `${base}/api/v1/streams/${encodeURIComponent(streamId)}/chat/ws?${qs}`
  }
}
