import { h as RoomSettings } from './types-B0jEi-Tw.js';

declare function sanitizeDisplayName(value: string, maxLength?: number): string;

declare function getStoredDisplayName(roomId: string): string | null;
declare function setStoredDisplayName(roomId: string, name: string): void;
declare function getStoredGuestId(roomId: string): string | null;
declare function setStoredGuestSession(roomId: string, session: {
    guestId: string;
    accessToken: string;
}): void;
declare function getStoredGuestToken(roomId: string): string | null;
declare function getOrCreateLobbyUserId(roomId: string, loggedInUserId?: string | null): string;
declare function resolveRoomDisplayName(roomId: string, options: {
    loggedInUsername?: string | null;
    guestInput?: string;
}): string;
declare function buildMediaLessConstraints(): MediaStreamConstraints;
declare function buildPrejoinMediaConstraints(options: {
    selectedAudio: string | null;
    selectedVideo: string | null;
    audioEnabled: boolean;
    videoEnabled: boolean;
}): MediaStreamConstraints;
declare function buildVideoOnlyConstraints(base?: MediaStreamConstraints): MediaStreamConstraints;
declare function buildAudioOnlyConstraints(base?: MediaStreamConstraints): MediaStreamConstraints;
declare const DEFAULT_ROOM_SETTINGS: RoomSettings;

export { DEFAULT_ROOM_SETTINGS as D, buildMediaLessConstraints as a, buildAudioOnlyConstraints as b, buildPrejoinMediaConstraints as c, buildVideoOnlyConstraints as d, getStoredDisplayName as e, getStoredGuestId as f, getOrCreateLobbyUserId as g, getStoredGuestToken as h, setStoredDisplayName as i, setStoredGuestSession as j, resolveRoomDisplayName as r, sanitizeDisplayName as s };
