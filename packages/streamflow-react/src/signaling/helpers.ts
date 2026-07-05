import { getWsBaseUrl, resolveAccessToken as resolveConfiguredToken } from "../core/config.js"

import type {
  BreakoutRoom,
  MeetingMode,
  MeetingPoll,
  MeetingQuestion,
  PermissionSet,
  ProjectFeaturesPayload,
  RoomSettings,
  SignalingIncomingMessage,
  SignalingOutgoingMessage,
  SignalingParticipant,
  SignalingPeerInfo,
  WaitingRoomUserInfo,
} from "./types"

type WireMessage = {
  type: string
  payload: Record<string, unknown>
}

const LOG_PREFIX = "[signaling]"

export function signalingLog(message: string, data?: unknown) {
  if (process.env.NODE_ENV === "production") return
  if (data !== undefined) {
    console.info(LOG_PREFIX, message, data)
    return
  }
  console.info(LOG_PREFIX, message)
}

export function signalingWarn(message: string, data?: unknown) {
  if (data !== undefined) {
    console.warn(LOG_PREFIX, message, data)
    return
  }
  console.warn(LOG_PREFIX, message)
}

export function buildSignalingWsUrl(token?: string | null, wsUrl?: string) {
  const base = getWsBaseUrl(wsUrl)
  const query = token ? `?token=${encodeURIComponent(token)}` : ""
  return `${base}/api/v1/ws${query}`
}

/** Resolves an access token for WebSocket connections. */
export async function resolveAccessToken(
  explicitToken?: string | null,
): Promise<string | null> {
  return resolveConfiguredToken(explicitToken)
}

export function normalizeSdp(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    if (typeof record.sdp === "string") {
      return normalizeSdp(record.sdp)
    }
  }

  return null
}

export function wireOutgoing(message: SignalingOutgoingMessage): WireMessage {
  switch (message.type) {
    case "join":
      return { type: "join", payload: { stream_id: message.stream_id } }
    case "join_room":
      return {
        type: "join_room",
        payload: {
          room_id: message.room_id,
          ...(message.username ? { username: message.username } : {}),
          ...(message.lobby_user_id ? { lobby_user_id: message.lobby_user_id } : {}),
        },
      }
    case "reconnect_room":
      return {
        type: "reconnect_room",
        payload: {
          room_id: message.room_id,
          ...(message.username ? { username: message.username } : {}),
          ...(message.lobby_user_id ? { lobby_user_id: message.lobby_user_id } : {}),
        },
      }
    case "answer":
      return { type: "answer", payload: { sdp: message.sdp } }
    case "ice_candidate":
      return { type: "ice_candidate", payload: { candidate: message.candidate } }
    case "leave":
      return { type: "leave", payload: {} }
    case "leave_room":
      return { type: "leave_room", payload: {} }
    case "mute_audio":
      return { type: "mute_audio", payload: {} }
    case "unmute_audio":
      return { type: "unmute_audio", payload: {} }
    case "mute_video":
      return { type: "mute_video", payload: {} }
    case "unmute_video":
      return { type: "unmute_video", payload: {} }
    case "screen_share_start":
      return { type: "screen_share_start", payload: {} }
    case "screen_share_stop":
      return { type: "screen_share_stop", payload: {} }
    case "raise_hand":
      return { type: "raise_hand", payload: {} }
    case "lower_hand":
      return { type: "lower_hand", payload: {} }
    case "reaction":
      return { type: "reaction", payload: { emoji: message.emoji } }
    case "mute_participant":
      return { type: "mute_participant", payload: { peer_id: message.peer_id } }
    case "mute_all":
      return { type: "mute_all", payload: {} }
    case "remove_participant":
      return { type: "remove_participant", payload: { peer_id: message.peer_id } }
    case "grant_permission":
      return {
        type: "grant_permission",
        payload: {
          peer_id: message.peer_id,
          permissions: message.permissions,
        },
      }
    case "revoke_permission":
      return { type: "revoke_permission", payload: { peer_id: message.peer_id } }
    case "approve_hand":
      return { type: "approve_hand", payload: { peer_id: message.peer_id } }
    case "promote_moderator":
      return { type: "promote_moderator", payload: { peer_id: message.peer_id } }
    case "transfer_host":
      return {
        type: "transfer_host",
        payload: {
          peer_id: message.peer_id,
          ...(message.user_id ? { user_id: message.user_id } : {}),
        },
      }
    case "lock_meeting":
      return { type: "lock_meeting", payload: {} }
    case "unlock_meeting":
      return { type: "unlock_meeting", payload: {} }
    case "end_meeting":
      return { type: "end_meeting", payload: {} }
    case "disable_all_cameras":
      return { type: "disable_all_cameras", payload: {} }
    case "start_recording":
      return { type: "start_recording", payload: {} }
    case "stop_recording":
      return { type: "stop_recording", payload: {} }
    case "update_room_settings":
      return { type: "update_room_settings", payload: message.patch }
    case "caption_update":
      return {
        type: "caption_update",
        payload: { text: message.text, final: message.final ?? false },
      }
    case "create_poll":
      return {
        type: "create_poll",
        payload: { question: message.question, options: message.options },
      }
    case "vote_poll":
      return {
        type: "vote_poll",
        payload: { poll_id: message.poll_id, option_id: message.option_id },
      }
    case "close_poll":
      return { type: "close_poll", payload: { poll_id: message.poll_id } }
    case "ask_question":
      return { type: "ask_question", payload: { content: message.content } }
    case "upvote_question":
      return {
        type: "upvote_question",
        payload: { question_id: message.question_id },
      }
    case "answer_question":
      return {
        type: "answer_question",
        payload: { question_id: message.question_id },
      }
    case "dismiss_question":
      return {
        type: "dismiss_question",
        payload: { question_id: message.question_id },
      }
    case "create_breakouts":
      return {
        type: "create_breakouts",
        payload: { count: message.count, names: message.names ?? [] },
      }
    case "assign_breakout":
      return {
        type: "assign_breakout",
        payload: {
          breakout_id: message.breakout_id,
          ...(message.peer_id ? { peer_id: message.peer_id } : {}),
        },
      }
    case "join_breakout":
      return {
        type: "join_breakout",
        payload: { breakout_id: message.breakout_id },
      }
    case "return_to_main":
      return { type: "return_to_main", payload: {} }
    case "close_breakouts":
      return { type: "close_breakouts", payload: {} }
  }
}

export function wireLobbyOutgoing(
  type: string,
  payload: Record<string, unknown>,
): string {
  return JSON.stringify({ type, payload })
}

export function parseSignalingMessage(
  raw: string,
): SignalingIncomingMessage | null {
  try {
    const wire = JSON.parse(raw) as {
      type?: string
      payload?: Record<string, unknown>
      [key: string]: unknown
    }

    if (!wire.type) {
      signalingWarn("ignored message without type", raw)
      return null
    }

    const payload = (wire.payload ?? wire) as Record<string, unknown>

    switch (wire.type) {
      case "joined":
        return {
          type: "joined",
          stream_id: payload.stream_id as string | undefined,
          peer_id: payload.peer_id as string | undefined,
        }
      case "room_joined":
        return {
          type: "room_joined",
          room_id: payload.room_id as string,
          peer_id: payload.peer_id as string,
          peers: (payload.peers as SignalingPeerInfo[]) ?? [],
          meeting_mode: payload.meeting_mode as MeetingMode | undefined,
          session_ver: payload.session_ver as number | undefined,
          publisher_count: payload.publisher_count as number | undefined,
          max_publishers: payload.max_publishers as number | undefined,
          is_recording: payload.is_recording as boolean | undefined,
          recording_id: payload.recording_id as string | undefined,
          recording_started_at: payload.recording_started_at as number | undefined,
          polls: payload.polls as MeetingPoll[] | undefined,
          questions: payload.questions as MeetingQuestion[] | undefined,
          breakouts: payload.breakouts as BreakoutRoom[] | undefined,
          breakout_id: payload.breakout_id as string | undefined,
          breakout_name: payload.breakout_name as string | undefined,
          room_settings: payload.room_settings as RoomSettings | undefined,
          project_features: payload.project_features as ProjectFeaturesPayload | undefined,
        }
      case "peer_joined":
        return {
          type: "peer_joined",
          peer_id: payload.peer_id as string,
          user_id: payload.user_id as string | undefined,
          username: payload.username as string | undefined,
          role: payload.role as SignalingPeerInfo["role"],
          permissions: payload.permissions as SignalingPeerInfo["permissions"],
          is_audio_muted: payload.is_audio_muted as boolean | undefined,
          is_video_muted: payload.is_video_muted as boolean | undefined,
          is_screen_sharing: payload.is_screen_sharing as boolean | undefined,
          hand_raised: payload.hand_raised as boolean | undefined,
        }
      case "peer_left":
        return { type: "peer_left", peer_id: payload.peer_id as string }
      case "peer_reconnecting":
        return { type: "peer_reconnecting", peer_id: payload.peer_id as string }
      case "peer_reconnected":
        return {
          type: "peer_reconnected",
          old_peer_id: payload.old_peer_id as string,
          peer_id: payload.peer_id as string,
          username: payload.username as string | undefined,
        }
      case "peer_caption":
        return {
          type: "peer_caption",
          peer_id: payload.peer_id as string,
          username: payload.username as string | undefined,
          text: payload.text as string,
          final: payload.final as boolean | undefined,
        }
      case "poll_created":
        return {
          type: "poll_created",
          poll: payload as unknown as MeetingPoll,
        }
      case "poll_updated":
        return {
          type: "poll_updated",
          poll: payload as unknown as MeetingPoll,
        }
      case "poll_closed":
        return { type: "poll_closed", poll_id: payload.poll_id as string }
      case "question_posted":
        return {
          type: "question_posted",
          question: payload as unknown as MeetingQuestion,
        }
      case "question_updated":
        return {
          type: "question_updated",
          question: payload as unknown as MeetingQuestion,
        }
      case "breakouts_created":
        return {
          type: "breakouts_created",
          rooms: (payload.rooms as BreakoutRoom[]) ?? [],
        }
      case "breakout_assigned":
        return {
          type: "breakout_assigned",
          peer_id: payload.peer_id as string,
          room: payload.room as BreakoutRoom,
        }
      case "breakouts_closed":
        return { type: "breakouts_closed" }
      case "peer_muted":
      case "peer_unmuted":
        return {
          type: "peer_muted",
          peer_id: payload.peer_id as string,
          kind: payload.kind as "audio" | "video",
          muted: payload.muted as boolean,
        }
      case "peer_screen_share":
        return {
          type: "peer_screen_share",
          peer_id: payload.peer_id as string,
          sharing: payload.sharing as boolean,
        }
      case "peer_hand_raised":
        return {
          type: "peer_hand_raised",
          peer_id: payload.peer_id as string,
          raised: payload.raised as boolean,
        }
      case "peer_reaction":
        return {
          type: "peer_reaction",
          peer_id: payload.peer_id as string,
          emoji: payload.emoji as string,
        }
      case "permission_updated":
        return {
          type: "permission_updated",
          peer_id: payload.peer_id as string,
          permissions: payload.permissions as PermissionSet,
        }
      case "participant_removed":
        return {
          type: "participant_removed",
          peer_id: payload.peer_id as string,
        }
      case "role_updated":
        return {
          type: "role_updated",
          peer_id: payload.peer_id as string,
          role: (payload.role as SignalingPeerInfo["role"]) ?? "guest",
          permissions: payload.permissions as PermissionSet | undefined,
        }
      case "meeting_locked":
        return {
          type: "meeting_locked",
          locked: payload.locked as boolean,
        }
      case "room_settings_updated":
        return {
          type: "room_settings_updated",
          settings: payload as unknown as RoomSettings,
        }
      case "meeting_mode_changed":
        return {
          type: "meeting_mode_changed",
          mode: payload.mode as MeetingMode,
          participant_count: payload.participant_count as number | undefined,
          publisher_count: (payload.publisher_count as number) ?? 0,
          max_publishers: (payload.max_publishers as number) ?? 0,
        }
      case "recording_started":
        return {
          type: "recording_started",
          recording_id: payload.recording_id as string,
          started_at: payload.started_at as number | undefined,
        }
      case "recording_stopped":
        return {
          type: "recording_stopped",
          recording_id: payload.recording_id as string,
        }
      case "offer": {
        const sdp =
          normalizeSdp(payload.sdp) ??
          normalizeSdp(payload.offer) ??
          normalizeSdp(payload.session_description)

        if (!sdp) {
          signalingWarn("offer missing sdp", payload)
          return null
        }

        return {
          type: "offer",
          sdp,
          peer_id: payload.peer_id as string | undefined,
          media_peer_id: payload.media_peer_id as string | undefined,
        }
      }
      case "track_published": {
        const peerId = payload.peer_id
        const trackId = payload.track_id
        const kind = payload.kind
        if (typeof peerId !== "string" || typeof trackId !== "string") {
          signalingWarn("track_published missing peer_id or track_id", payload)
          return null
        }
        return {
          type: "track_published",
          peer_id: peerId,
          track_id: trackId,
          kind: typeof kind === "string" ? kind : "video",
        }
      }
      case "ice_candidate": {
        const candidate = payload.candidate
        if (typeof candidate !== "string" || candidate.length > 16_384) {
          signalingWarn("ice_candidate missing or oversized candidate", payload)
          return null
        }
        return {
          type: "ice_candidate",
          candidate,
        }
      }
      case "stream_ended":
        return {
          type: "stream_ended",
          stream_id: payload.stream_id as string | undefined,
        }
      case "room_ended":
        return {
          type: "room_ended",
          room_id: payload.room_id as string | undefined,
        }
      case "error":
        return {
          type: "error",
          code: payload.code as string | undefined,
          message: payload.message as string | undefined,
        }
      case "waiting_room_user_list":
        return {
          type: "waiting_room_user_list",
          state: (payload.state as string) ?? "waiting_for_host",
          users: (payload.users as WaitingRoomUserInfo[]) ?? [],
          updated_at: payload.updated_at as number | undefined,
        }
      case "waiting_room_admitted":
        return { type: "waiting_room_admitted" }
      case "waiting_room_rejected":
        return { type: "waiting_room_rejected" }
      case "waiting_room_meeting_started":
        return { type: "waiting_room_meeting_started" }
      default:
        signalingWarn("unsupported message type", wire.type)
        return null
    }
  } catch (error) {
    signalingWarn("failed to parse message", { raw, error })
    return null
  }
}

const ERROR_LABELS: Record<string, string> = {
  sfu_disabled: "WebRTC is unavailable on this server",
  stream_unavailable: "Stream is not live",
  room_unavailable: "Room is not live yet — wait for the host",
  payment_required: "Payment is required to watch this stream",
  not_found: "Stream not found",
  room_start_failed: "Could not start the room",
  sfu_error: "WebRTC session setup failed",
  invalid_request: "Invalid signaling request",
  invalid_state: "Signaling connection is out of sync",
  access_error: "Access check failed",
  unsupported_message: "Unsupported signaling message",
  waiting_room_not_admitted: "Waiting for the host to admit you",
  waiting_room_disabled: "Waiting room is not enabled for this room",
  join_failed: "Failed to join the meeting",
  reconnect_failed: "Failed to reconnect to the meeting",
  forbidden: "You don't have permission to do that",
  permission_denied: "Publishing is not allowed for your role",
  publisher_limit: "The speaker limit has been reached",
  recording_active: "Recording is already in progress",
  recording_not_active: "No recording is active",
  recording_disabled: "Recording is not enabled for this meeting",
  recording_unavailable: "No active media session for recording",
  governance_error: "That action could not be completed",
}

export type MeetingErrorKind =
  | "connection"
  | "permission"
  | "waiting"
  | "room"
  | "media"
  | "removed"
  | "unknown"

export interface MeetingErrorViewModel {
  kind: MeetingErrorKind
  title: string
  description: string
  code?: string
  recoverable: boolean
  /** When false, show as a dismissible notice — never tear down media or block the UI. */
  blocking: boolean
}

const ERROR_DETAILS: Record<
  string,
  Pick<
    MeetingErrorViewModel,
    "kind" | "title" | "description" | "recoverable" | "blocking"
  >
> = {
  sfu_disabled: {
    kind: "connection",
    title: "Video calling unavailable",
    description:
      "This server does not have WebRTC enabled. Contact the host or try again later.",
    recoverable: false,
    blocking: true,
  },
  stream_unavailable: {
    kind: "room",
    title: "Meeting not live",
    description: "The host has not started this meeting yet.",
    recoverable: true,
    blocking: true,
  },
  room_unavailable: {
    kind: "room",
    title: "Waiting for the host",
    description:
      "The meeting has not started yet. Stay on this page and you'll join automatically when the host opens the room.",
    recoverable: true,
    blocking: false,
  },
  room_start_failed: {
    kind: "room",
    title: "Could not start the meeting",
    description:
      "We couldn't bring the room online. Check your connection and try again.",
    recoverable: true,
    blocking: true,
  },
  payment_required: {
    kind: "permission",
    title: "Access required",
    description: "You need access to join this meeting. Complete payment or request access from the host.",
    recoverable: false,
    blocking: true,
  },
  not_found: {
    kind: "room",
    title: "Meeting not found",
    description: "This room may have been deleted or the link is incorrect.",
    recoverable: false,
    blocking: true,
  },
  sfu_error: {
    kind: "connection",
    title: "Could not connect audio & video",
    description:
      "Your browser couldn't establish a media session. Try again or join without camera and microphone first.",
    recoverable: true,
    blocking: true,
  },
  join_failed: {
    kind: "connection",
    title: "Couldn't join the meeting",
    description:
      "Something went wrong while joining. Check your network and try again.",
    recoverable: true,
    blocking: true,
  },
  reconnect_failed: {
    kind: "connection",
    title: "Reconnection failed",
    description:
      "We couldn't restore your session after a disconnect. Try joining again.",
    recoverable: true,
    blocking: false,
  },
  waiting_room_not_admitted: {
    kind: "waiting",
    title: "Waiting for admission",
    description:
      "The host has not admitted you yet. You'll join automatically once approved.",
    recoverable: true,
    blocking: false,
  },
  waiting_room_disabled: {
    kind: "waiting",
    title: "Waiting room unavailable",
    description: "This meeting is not using a waiting room. Try joining again.",
    recoverable: true,
    blocking: false,
  },
  invalid_state: {
    kind: "connection",
    title: "Session out of sync",
    description: "Your connection lost track of the meeting. Rejoin to continue.",
    recoverable: true,
    blocking: false,
  },
  access_error: {
    kind: "permission",
    title: "Access check failed",
    description: "We couldn't verify your access to this meeting. Try again in a moment.",
    recoverable: true,
    blocking: false,
  },
  forbidden: {
    kind: "permission",
    title: "Action not allowed",
    description: "You don't have permission to perform that action in this meeting.",
    recoverable: false,
    blocking: false,
  },
  permission_denied: {
    kind: "permission",
    title: "Microphone or camera blocked",
    description: "Your role does not allow publishing right now. Ask the host for permission.",
    recoverable: false,
    blocking: false,
  },
  publisher_limit: {
    kind: "permission",
    title: "Speaker limit reached",
    description: "The maximum number of active speakers has been reached.",
    recoverable: false,
    blocking: false,
  },
  governance_error: {
    kind: "room",
    title: "Action could not be completed",
    description: "That action could not be completed. Try again or ask the host.",
    recoverable: false,
    blocking: false,
  },
  recording_active: {
    kind: "room",
    title: "Recording in progress",
    description: "This meeting is already being recorded.",
    recoverable: true,
    blocking: false,
  },
  recording_not_active: {
    kind: "room",
    title: "No active recording",
    description: "There is no recording running for this meeting.",
    recoverable: true,
    blocking: false,
  },
  recording_disabled: {
    kind: "room",
    title: "Recording unavailable",
    description: "Recording is not enabled for this meeting.",
    recoverable: false,
    blocking: false,
  },
  recording_unavailable: {
    kind: "room",
    title: "Recording unavailable",
    description:
      "Recording could not start because no participants are connected to the media server yet.",
    recoverable: true,
    blocking: false,
  },
}

const FATAL_BLOCKING_CODES = new Set([
  "sfu_disabled",
  "not_found",
  "payment_required",
])

export function isMeetingErrorBlocking(
  error: MeetingErrorViewModel,
  inSession: boolean,
): boolean {
  if (error.blocking === false) return false
  if (error.kind === "removed") return true
  if (/room ended|meeting ended/i.test(`${error.title} ${error.description}`)) {
    return true
  }
  if (inSession && !FATAL_BLOCKING_CODES.has(error.code ?? "")) {
    return false
  }
  return true
}

const MESSAGE_PATTERNS: Array<{
  match: RegExp | string
  error: MeetingErrorViewModel
}> = [
  {
    match: /timed out waiting to join/i,
    error: {
      kind: "connection",
      title: "Join timed out",
      description:
        "The meeting took too long to respond. Check your connection and try again.",
      recoverable: true,
      blocking: true,
    },
  },
  {
    match: /webrtc connection failed/i,
    error: {
      kind: "connection",
      title: "Connection lost",
      description:
        "Your media connection dropped. Try rejoining the meeting.",
      recoverable: true,
      blocking: false,
    },
  },
  {
    match: /camera\/microphone permission denied|permission denied/i,
    error: {
      kind: "media",
      title: "Camera or microphone blocked",
      description:
        "Allow camera and microphone access in your browser settings, then try joining again.",
      recoverable: true,
      blocking: true,
    },
  },
  {
    match: /unable to access camera\/mic/i,
    error: {
      kind: "media",
      title: "Camera or microphone blocked",
      description:
        "Allow camera and microphone access in your browser settings, then try again.",
      recoverable: true,
      blocking: false,
    },
  },
  {
    match: /removed from the meeting/i,
    error: {
      kind: "removed",
      title: "You were removed",
      description: "The host removed you from this meeting.",
      recoverable: false,
      blocking: true,
    },
  },
  {
    match: /room ended/i,
    error: {
      kind: "room",
      title: "Meeting ended",
      description: "The host has ended this meeting for everyone.",
      recoverable: false,
      blocking: true,
    },
  },
  {
    match: /rejected by the host/i,
    error: {
      kind: "waiting",
      title: "Admission denied",
      description: "The host did not admit you to this meeting.",
      recoverable: false,
      blocking: true,
    },
  },
  {
    match: /room id is required/i,
    error: {
      kind: "room",
      title: "Invalid room",
      description: "This meeting link is missing a room identifier.",
      recoverable: false,
      blocking: true,
    },
  },
]

export function resolveMeetingError(input: {
  code?: string
  message?: string
}): MeetingErrorViewModel {
  const code = input.code?.trim()
  const message = input.message?.trim() ?? ""

  if (code && ERROR_DETAILS[code]) {
    const detail = ERROR_DETAILS[code]
    return { code, ...detail }
  }

  if (code && ERROR_LABELS[code]) {
    return {
      code,
      kind: code === "forbidden" || code === "permission_denied" ? "permission" : "unknown",
      title: "Something went wrong",
      description: ERROR_LABELS[code],
      recoverable: true,
      blocking: code === "forbidden" || code === "permission_denied" || code === "publisher_limit"
        ? false
        : true,
    }
  }

  for (const pattern of MESSAGE_PATTERNS) {
    const matches =
      typeof pattern.match === "string"
        ? message.toLowerCase().includes(pattern.match.toLowerCase())
        : pattern.match.test(message)
    if (matches) {
      return { ...pattern.error, code, description: message || pattern.error.description }
    }
  }

  if (message) {
    return {
      code,
      kind: "unknown",
      title: "Something went wrong",
      description: message,
      recoverable: true,
      blocking: false,
    }
  }

  return {
    code,
    kind: "connection",
    title: "Connection problem",
    description: "We couldn't connect to the meeting. Please try again.",
    recoverable: true,
    blocking: true,
  }
}

export function signalingErrorMessage(message: SignalingIncomingMessage) {
  if (message.type !== "error") return "Signaling connection failed"
  if (message.message?.trim()) {
    return message.message.trim()
  }
  if (message.code && ERROR_LABELS[message.code]) {
    return ERROR_LABELS[message.code]
  }
  return message.message ?? "Signaling connection failed"
}

export function signalingErrorViewModel(
  message: SignalingIncomingMessage,
): MeetingErrorViewModel {
  if (message.type !== "error") {
    return resolveMeetingError({ message: "Signaling connection failed" })
  }
  return resolveMeetingError({
    code: message.code,
    message: signalingErrorMessage(message),
  })
}

export function serializeIceCandidate(candidate: RTCIceCandidate): string {
  return JSON.stringify(candidate.toJSON())
}

export function participantHasDisplayableVideo(
  participant: SignalingParticipant,
): boolean {
  if (participant.videoOff) return false
  return (
    participant.stream?.getVideoTracks().some(
      (track) =>
        track.readyState === "live" && track.enabled && !track.muted,
    ) ?? false
  )
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function mergeRemoteTrack(
  existing: MediaStream | null,
  track: MediaStreamTrack,
): MediaStream {
  const stream = new MediaStream(existing ? existing.getTracks() : [])
  const sameKind = stream.getTracks().find((item) => item.kind === track.kind)
  if (sameKind) {
    if (sameKind.id === track.id) {
      return stream
    }
    stream.removeTrack(sameKind)
    // Do not call stop() — SFU renegotiation ends the old track when the new one is ready
  }
  stream.addTrack(track)
  return stream
}

/** Max SDP size guard against malformed / oversized payloads. */
const MAX_SDP_LENGTH = 512_000

/** Strip control chars and cap length for display names sent to signaling. */
export { sanitizeDisplayName } from "./display-name"

export function normalizeSdpText(sdp: string): string {
  let text = sdp.trim().replace(/\\n/g, "\n").replace(/\\r/g, "\r")

  const hasLineBreaks = /\r?\n/.test(text)

  // Only repair space-separated attributes on genuinely single-line SDPs.
  // CRLF SDPs use \r\na= — checking for "\na=" misses them and corrupts lines.
  if (!hasLineBreaks) {
    if (text.includes(" a=")) {
      text = text.replace(/ a=/g, "\na=")
    }
    if (!text.includes("\n") && text.includes(" ")) {
      text = text
        .replace(/^v=0 /, "v=0\n")
        .replace(/ o=/, "\no=")
        .replace(/ s=/, "\ns=")
        .replace(/ t=/, "\nt=")
        .replace(/ m=/g, "\nm=")
    }
  }

  return `${text.replace(/\r?\n/g, "\r\n").trim()}\r\n`
}

/**
 * Browser-oriented SDP repair — keeps all media attrs, fixes common parse failures.
 * - Lowercase fingerprint hashes (Chrome is strict on some builds)
 * - Drop redundant session-level DTLS lines when media sections already carry them
 */
export function repairSdpForNegotiation(sdp: string): string {
  const lines = normalizeSdpText(sdp)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^a=fingerprint:(\S+)\s+(.+)$/)
    if (match) {
      lines[i] = `a=fingerprint:${match[1]} ${match[2].toLowerCase()}`
    }
  }

  const firstMedia = lines.findIndex((line) => line.startsWith("m="))
  if (firstMedia === -1) {
    return `${lines.join("\r\n")}\r\n`
  }

  const mediaLines = lines.slice(firstMedia)
  const mediaHasFingerprint = mediaLines.some((line) =>
    line.startsWith("a=fingerprint:"),
  )

  if (!mediaHasFingerprint) {
    return `${lines.join("\r\n")}\r\n`
  }

  const redundantSessionAttrs = [
    "a=fingerprint:",
    "a=setup:",
    "a=ice-ufrag:",
    "a=ice-pwd:",
  ]

  const repaired = lines.filter((line, index) => {
    if (index >= firstMedia) return true
    if (!line.startsWith("a=")) return true
    return !redundantSessionAttrs.some((prefix) => line.startsWith(prefix))
  })

  return `${repaired.join("\r\n")}\r\n`
}

/** Safe for room SFU — format normalization + browser repair, never strips codec attrs. */
export function sanitizeSdpSafe(sdp: string): string {
  if (sdp.length > MAX_SDP_LENGTH) {
    throw new Error("SDP payload exceeds maximum allowed size")
  }
  const normalized = repairSdpForNegotiation(sdp)
  if (!normalized.startsWith("v=")) {
    throw new Error("SDP must start with v=0")
  }
  return normalized
}

export function isValidIceCandidateInit(
  init: RTCIceCandidateInit,
): init is RTCIceCandidateInit {
  if (!init || typeof init !== "object") return false
  if (init.candidate === "" || init.candidate === undefined) return true
  if (typeof init.candidate !== "string") return false
  if (init.candidate.length > 8_192) return false
  return true
}

export function parseIceCandidateInit(
  candidateJson: string,
): RTCIceCandidateInit | null {
  if (!candidateJson || candidateJson.length > 16_384) return null

  try {
    const parsed = JSON.parse(candidateJson) as RTCIceCandidateInit
    if (!isValidIceCandidateInit(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * SDP Validation & Debugging Utilities
 */

export interface SdpInfo {
  hasIceUfrag: boolean
  hasIcePwd: boolean
  hasFingerprint: boolean
  hasSetup: boolean
  mediaLines: number
  audioLines: number
  videoLines: number
  hasSendrecv: boolean
  hasRecvonly: boolean
  hasSendonly: boolean
  lineCount: number
}

export function analyzeSdp(sdp?: string | null): SdpInfo {
  if (!sdp) {
    return {
      hasIceUfrag: false,
      hasIcePwd: false,
      hasFingerprint: false,
      hasSetup: false,
      mediaLines: 0,
      audioLines: 0,
      videoLines: 0,
      hasSendrecv: false,
      hasRecvonly: false,
      hasSendonly: false,
      lineCount: 0,
    }
  }

  const lines = sdp
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const mediaLines = lines.filter((l) => l.startsWith('m='))

  return {
    hasIceUfrag: lines.some((l) => l.startsWith('a=ice-ufrag:')),
    hasIcePwd: lines.some((l) => l.startsWith('a=ice-pwd:')),
    hasFingerprint: lines.some((l) => l.startsWith('a=fingerprint:')),
    hasSetup: lines.some((l) => l.startsWith('a=setup:')),
    mediaLines: mediaLines.length,
    audioLines: mediaLines.filter((l) => l.startsWith('m=audio')).length,
    videoLines: mediaLines.filter((l) => l.startsWith('m=video')).length,
    hasSendrecv: lines.some((l) => l.includes('a=sendrecv')),
    hasRecvonly: lines.some((l) => l.includes('a=recvonly')),
    hasSendonly: lines.some((l) => l.includes('a=sendonly')),
    lineCount: lines.length,
  }
}

export function validateRoomModeSdp(
  sdp: string,
  context: "offer" | "answer",
): { valid: boolean; critical: string[]; warnings: string[] } {
  const critical: string[] = []
  const warnings: string[] = []
  const info = analyzeSdp(sdp)

  if (!sdp.startsWith("v=")) {
    critical.push("SDP does not start with v=0")
  }

  if (info.mediaLines === 0) {
    critical.push("No media sections found")
  }

  if (!info.hasFingerprint && !info.hasSetup && !info.hasIceUfrag) {
    critical.push("Missing DTLS/ICE attributes")
  }

  if (!info.hasIceUfrag) warnings.push("Missing ice-ufrag attribute")
  if (!info.hasIcePwd) warnings.push("Missing ice-pwd attribute")
  if (!info.hasFingerprint) warnings.push("Missing fingerprint attribute")
  if (info.hasRecvonly && context === "offer" && !info.hasSendrecv) {
    warnings.push("SDP contains recvonly — bidirectional room mode expects sendrecv")
  }
  if (info.hasRecvonly && context === "answer" && !info.hasSendrecv) {
    warnings.push(
      "answer is recvonly only — local camera/mic may not be published",
    )
  }
  if (info.audioLines === 0) warnings.push("No audio media section")
  if (info.videoLines === 0) warnings.push("No video media section")

  return {
    valid: critical.length === 0,
    critical,
    warnings,
  }
}

export function logSdpAnalysis(
  sdp: string,
  label: string,
  context: "offer" | "answer" = "offer",
) {
  const info = analyzeSdp(sdp)
  const validation = validateRoomModeSdp(sdp, context)

  signalingLog(`${label} SDP Analysis:`, {
    mediaLines: info.mediaLines,
    audio: info.audioLines,
    video: info.videoLines,
    iceUfrag: info.hasIceUfrag,
    icePwd: info.hasIcePwd,
    fingerprint: info.hasFingerprint,
    setup: info.hasSetup,
    directions: {
      sendrecv: info.hasSendrecv,
      recvonly: info.hasRecvonly,
      sendonly: info.hasSendonly,
    },
    valid: validation.valid,
    critical: validation.critical,
    warnings: validation.warnings,
  })

  for (const issue of validation.critical) {
    signalingWarn(`${label} SDP critical: ${issue}`)
  }
  for (const issue of validation.warnings) {
    signalingWarn(`${label} SDP warning: ${issue}`)
  }
}
