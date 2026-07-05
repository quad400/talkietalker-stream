import {
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
  sanitizeDisplayName
} from "./chunk-6JT6IE2I.js";

// src/signaling/room-session-storage.ts
var DISPLAY_NAME_KEY = (roomId) => `room-display-name:${roomId}`;
var GUEST_ID_KEY = (roomId) => `room-guest-id:${roomId}`;
var GUEST_TOKEN_KEY = (roomId) => `room-guest-token:${roomId}`;
var LOBBY_USER_ID_KEY = (roomId) => `room-lobby-user-id:${roomId}`;
function getStoredDisplayName(roomId) {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(DISPLAY_NAME_KEY(roomId));
  return value ? sanitizeDisplayName(value) : null;
}
function setStoredDisplayName(roomId, name) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DISPLAY_NAME_KEY(roomId), sanitizeDisplayName(name));
}
function getStoredGuestId(roomId) {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(GUEST_ID_KEY(roomId));
}
function setStoredGuestSession(roomId, session) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUEST_ID_KEY(roomId), session.guestId);
  sessionStorage.setItem(GUEST_TOKEN_KEY(roomId), session.accessToken);
}
function getStoredGuestToken(roomId) {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(GUEST_TOKEN_KEY(roomId));
}
function getOrCreateLobbyUserId(roomId, loggedInUserId) {
  if (loggedInUserId?.trim()) return loggedInUserId.trim();
  if (typeof window === "undefined") return "guest";
  const existing = sessionStorage.getItem(LOBBY_USER_ID_KEY(roomId));
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(LOBBY_USER_ID_KEY(roomId), id);
  return id;
}
function resolveRoomDisplayName(roomId, options) {
  if (options.loggedInUsername?.trim()) {
    return sanitizeDisplayName(options.loggedInUsername);
  }
  if (options.guestInput?.trim()) {
    return sanitizeDisplayName(options.guestInput);
  }
  const stored = getStoredDisplayName(roomId);
  if (stored) return stored;
  return "Guest";
}
function buildMediaLessConstraints() {
  return { audio: false, video: false };
}
function buildPrejoinMediaConstraints(options) {
  const audio = options.audioEnabled ? options.selectedAudio ? { deviceId: { ideal: options.selectedAudio } } : true : false;
  const video = options.videoEnabled ? options.selectedVideo ? {
    ...DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
    deviceId: { ideal: options.selectedVideo }
  } : DEFAULT_CAMERA_VIDEO_CONSTRAINTS : false;
  return { audio, video };
}
function buildVideoOnlyConstraints(base) {
  if (!base || base.video === false) {
    return { audio: false, video: DEFAULT_CAMERA_VIDEO_CONSTRAINTS };
  }
  return { audio: false, video: base.video ?? DEFAULT_CAMERA_VIDEO_CONSTRAINTS };
}
function buildAudioOnlyConstraints(base) {
  if (!base || base.audio === false) {
    return { audio: true, video: false };
  }
  return { audio: base.audio ?? true, video: false };
}
var DEFAULT_ROOM_SETTINGS = {
  waiting_room_enabled: false,
  guest_can_chat: true,
  guest_can_react: true,
  guest_can_raise_hand: true,
  polls_enabled: true,
  qa_enabled: true,
  breakouts_enabled: true,
  is_recording_enabled: false
};

export {
  getStoredDisplayName,
  setStoredDisplayName,
  getStoredGuestId,
  setStoredGuestSession,
  getStoredGuestToken,
  getOrCreateLobbyUserId,
  resolveRoomDisplayName,
  buildMediaLessConstraints,
  buildPrejoinMediaConstraints,
  buildVideoOnlyConstraints,
  buildAudioOnlyConstraints,
  DEFAULT_ROOM_SETTINGS
};
//# sourceMappingURL=chunk-U7MD5TET.js.map