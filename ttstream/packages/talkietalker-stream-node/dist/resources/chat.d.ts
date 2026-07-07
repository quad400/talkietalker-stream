import { TalkieTalkerStreamResource } from '../core/TalkieTalkerStreamResource.js';
import type { RequestOptions } from '../types/index.js';
export interface ChatMessage {
    id: string;
    user_id?: string;
    username?: string;
    content?: string;
    is_deleted?: boolean;
    created_at?: string;
}
export interface ChatHistoryResult {
    data: ChatMessage[];
    has_more?: boolean;
}
export interface ListChatHistoryParams {
    before?: string;
    limit?: number;
}
export interface ChatBanParams {
    reason?: string;
}
export interface ChatBanResult {
    banned_user_id?: string;
    channel_user_id?: string;
    reason?: string;
    banned_at?: string;
}
export interface ChatModerator {
    id: string;
    moderator_user_id?: string;
    moderator_username?: string;
    granted_at?: string;
}
export interface AddModeratorParams {
    userId: string;
}
/** Per-stream chat history and moderation (`/api/v1/streams/{id}/chat/*`). */
export declare class ChatResource extends TalkieTalkerStreamResource {
    listHistory(streamId: string, params?: ListChatHistoryParams, opts?: RequestOptions): Promise<ChatHistoryResult>;
    deleteMessage(streamId: string, messageId: string, opts?: RequestOptions): Promise<{
        id: string;
        is_deleted?: boolean;
        deleted_at?: string;
    }>;
    pinMessage(streamId: string, messageId: string, opts?: RequestOptions): Promise<{
        id: string;
    }>;
    unpinMessage(streamId: string, messageId: string, opts?: RequestOptions): Promise<void>;
    banUser(streamId: string, userId: string, params?: ChatBanParams, opts?: RequestOptions): Promise<ChatBanResult>;
    unbanUser(streamId: string, userId: string, opts?: RequestOptions): Promise<void>;
    listModerators(streamId: string, opts?: RequestOptions): Promise<{
        data: ChatModerator[];
    }>;
    addModerator(streamId: string, params: AddModeratorParams, opts?: RequestOptions): Promise<ChatModerator>;
    removeModerator(streamId: string, moderatorId: string, opts?: RequestOptions): Promise<void>;
    /** WebSocket URL for live chat (pass JWT as `token` query param). */
    websocketUrl(baseURL: string, streamId: string, token: string): string;
}
