import { sanitizeDisplayName } from "./display-name.js"
import { DEFAULT_CAMERA_VIDEO_CONSTRAINTS } from "./video-quality.js"
import type { RoomSettings } from "./types.js"

const DISPLAY_NAME_KEY = (roomId: string) => `room-display-name:${roomId}`
const GUEST_ID_KEY = (roomId: string) => `room-guest-id:${roomId}`
const GUEST_TOKEN_KEY = (roomId: string) => `room-guest-token:${roomId}`
const LOBBY_USER_ID_KEY = (roomId: string) => `room-lobby-user-id:${roomId}`

export function getStoredDisplayName(roomId: string): string | null {
  if (typeof window === "undefined") return null
  const value = sessionStorage.getItem(DISPLAY_NAME_KEY(roomId))
  return value ? sanitizeDisplayName(value) : null
}

export function setStoredDisplayName(roomId: string, name: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(DISPLAY_NAME_KEY(roomId), sanitizeDisplayName(name))
}

export function getStoredGuestId(roomId: string): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(GUEST_ID_KEY(roomId))
}

export function setStoredGuestSession(
  roomId: string,
  session: { guestId: string; accessToken: string },
) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(GUEST_ID_KEY(roomId), session.guestId)
  sessionStorage.setItem(GUEST_TOKEN_KEY(roomId), session.accessToken)
}

export function getStoredGuestToken(roomId: string): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(GUEST_TOKEN_KEY(roomId))
}

export function getOrCreateLobbyUserId(
  roomId: string,
  loggedInUserId?: string | null,
): string {
  if (loggedInUserId?.trim()) return loggedInUserId.trim()

  if (typeof window === "undefined") return "guest"

  const existing = sessionStorage.getItem(LOBBY_USER_ID_KEY(roomId))
  if (existing) return existing

  const id = crypto.randomUUID()
  sessionStorage.setItem(LOBBY_USER_ID_KEY(roomId), id)
  return id
}

export function resolveRoomDisplayName(
  roomId: string,
  options: {
    loggedInUsername?: string | null
    guestInput?: string
  },
): string {
  if (options.loggedInUsername?.trim()) {
    return sanitizeDisplayName(options.loggedInUsername)
  }

  if (options.guestInput?.trim()) {
    return sanitizeDisplayName(options.guestInput)
  }

  const stored = getStoredDisplayName(roomId)
  if (stored) return stored

  return "Guest"
}

export function buildMediaLessConstraints(): MediaStreamConstraints {
  return { audio: false, video: false }
}

export function buildPrejoinMediaConstraints(options: {
  selectedAudio: string | null
  selectedVideo: string | null
  audioEnabled: boolean
  videoEnabled: boolean
}): MediaStreamConstraints {
  const audio = options.audioEnabled
    ? options.selectedAudio
      ? { deviceId: { ideal: options.selectedAudio } }
      : true
    : false

  const video = options.videoEnabled
    ? options.selectedVideo
      ? {
          ...DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
          deviceId: { ideal: options.selectedVideo },
        }
      : DEFAULT_CAMERA_VIDEO_CONSTRAINTS
    : false

  return { audio, video }
}

export function buildVideoOnlyConstraints(
  base?: MediaStreamConstraints,
): MediaStreamConstraints {
  if (!base || base.video === false) {
    return { audio: false, video: DEFAULT_CAMERA_VIDEO_CONSTRAINTS }
  }

  return { audio: false, video: base.video ?? DEFAULT_CAMERA_VIDEO_CONSTRAINTS }
}

export function buildAudioOnlyConstraints(
  base?: MediaStreamConstraints,
): MediaStreamConstraints {
  if (!base || base.audio === false) {
    return { audio: true, video: false }
  }

  return { audio: base.audio ?? true, video: false }
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  waiting_room_enabled: false,
  guest_can_chat: true,
  guest_can_react: true,
  guest_can_raise_hand: true,
  polls_enabled: true,
  qa_enabled: true,
  breakouts_enabled: true,
  is_recording_enabled: false,
}
