// src/constants/env.ts
var DEFAULT_TOKEN_PATH = "/api/talkietalker-stream/token";
var SANDBOX_WS_URL = "ws://localhost:8080";
var PRODUCTION_WS_URL = "wss://api.talkietalker.stream";
function resolveWsUrlFromPublishKey(publishKey) {
  return publishKey.includes("_test_") ? SANDBOX_WS_URL : PRODUCTION_WS_URL;
}
function readPublishKeyFromEnv() {
  if (typeof process !== "undefined") {
    const fromNext = process.env.NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY?.trim();
    if (fromNext) return fromNext;
    const fromVite = process.env.VITE_TALKIETALKER_STREAM_PUBLISH_KEY?.trim();
    if (fromVite) return fromVite;
    const generic = process.env.TALKIETALKER_STREAM_PUBLISH_KEY?.trim();
    if (generic) return generic;
  }
  if (typeof import.meta !== "undefined") {
    const meta = import.meta;
    const vite = meta.env?.VITE_TALKIETALKER_STREAM_PUBLISH_KEY?.trim();
    if (vite) return vite;
  }
  return void 0;
}

// src/core/config.ts
var config = {};
function setTalkieTalkerStreamConfig(next) {
  config = { ...config, ...next };
}
function getTalkieTalkerStreamConfig() {
  return config;
}
function readWsUrlFromEnv() {
  if (typeof process !== "undefined") {
    const fromNext = process.env.NEXT_PUBLIC_WS_URL?.trim();
    if (fromNext) return fromNext.replace(/\/$/, "");
    const api = process.env.NEXT_PUBLIC_STREAM_API_URL?.trim() ?? process.env.NEXT_PUBLIC_API_URL?.trim();
    if (api) return api.replace(/\/$/, "").replace(/^http/i, "ws");
  }
  if (typeof import.meta !== "undefined") {
    const meta = import.meta;
    const vite = meta.env?.VITE_WS_URL?.trim();
    if (vite) return vite.replace(/\/$/, "");
  }
  const publishKey = readPublishKeyFromEnv();
  if (publishKey) return resolveWsUrlFromPublishKey(publishKey);
  return void 0;
}
async function resolveAccessToken(explicitToken) {
  if (explicitToken) return explicitToken;
  if (config.getAccessToken) return config.getAccessToken();
  return null;
}
function getWsBaseUrl(explicit) {
  const configured = explicit?.replace(/\/$/, "") ?? config.wsUrl?.replace(/\/$/, "") ?? readWsUrlFromEnv();
  if (configured) return configured;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/^http/i, "ws");
  }
  return "ws://localhost:8080";
}
function themeToCssVars(theme, preset = "dark") {
  const dark = preset === "dark";
  return {
    "--sf-primary": theme?.primaryColor ?? "#6366f1",
    "--sf-radius": theme?.borderRadius ?? "8px",
    "--sf-bg": theme?.backgroundColor ?? (dark ? "#0f172a" : "#ffffff"),
    "--sf-text": theme?.textColor ?? (dark ? "#f8fafc" : "#0f172a"),
    "--sf-surface": dark ? "#1e293b" : "#f1f5f9",
    "--sf-border": dark ? "#334155" : "#e2e8f0",
    "--sf-muted": dark ? "#94a3b8" : "#64748b",
    "--sf-font": theme?.fontFamily ?? "system-ui, sans-serif"
  };
}
function applyCustomCss(url, doc = typeof document !== "undefined" ? document : null) {
  if (!doc) return () => {
  };
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  doc.head.appendChild(link);
  return () => link.remove();
}

// src/signaling/display-name.ts
function sanitizeDisplayName(value, maxLength = 64) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength) || "Guest";
}

// src/signaling/helpers.ts
var LOG_PREFIX = "[signaling]";
function signalingLog(message, data) {
  if (process.env.NODE_ENV === "production") return;
  if (data !== void 0) {
    console.info(LOG_PREFIX, message, data);
    return;
  }
  console.info(LOG_PREFIX, message);
}
function signalingWarn(message, data) {
  if (data !== void 0) {
    console.warn(LOG_PREFIX, message, data);
    return;
  }
  console.warn(LOG_PREFIX, message);
}
function buildSignalingWsUrl(token, wsUrl) {
  const base = getWsBaseUrl(wsUrl);
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/api/v1/ws${query}`;
}
async function resolveAccessToken2(explicitToken) {
  return resolveAccessToken(explicitToken);
}
function normalizeSdp(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value && typeof value === "object") {
    const record = value;
    if (typeof record.sdp === "string") {
      return normalizeSdp(record.sdp);
    }
  }
  return null;
}
function wireOutgoing(message) {
  switch (message.type) {
    case "join":
      return { type: "join", payload: { stream_id: message.stream_id } };
    case "join_room":
      return {
        type: "join_room",
        payload: {
          room_id: message.room_id,
          ...message.username ? { username: message.username } : {},
          ...message.lobby_user_id ? { lobby_user_id: message.lobby_user_id } : {}
        }
      };
    case "reconnect_room":
      return {
        type: "reconnect_room",
        payload: {
          room_id: message.room_id,
          ...message.username ? { username: message.username } : {},
          ...message.lobby_user_id ? { lobby_user_id: message.lobby_user_id } : {}
        }
      };
    case "answer":
      return { type: "answer", payload: { sdp: message.sdp } };
    case "ice_candidate":
      return { type: "ice_candidate", payload: { candidate: message.candidate } };
    case "leave":
      return { type: "leave", payload: {} };
    case "leave_room":
      return { type: "leave_room", payload: {} };
    case "mute_audio":
      return { type: "mute_audio", payload: {} };
    case "unmute_audio":
      return { type: "unmute_audio", payload: {} };
    case "mute_video":
      return { type: "mute_video", payload: {} };
    case "unmute_video":
      return { type: "unmute_video", payload: {} };
    case "screen_share_start":
      return { type: "screen_share_start", payload: {} };
    case "screen_share_stop":
      return { type: "screen_share_stop", payload: {} };
    case "raise_hand":
      return { type: "raise_hand", payload: {} };
    case "lower_hand":
      return { type: "lower_hand", payload: {} };
    case "reaction":
      return { type: "reaction", payload: { emoji: message.emoji } };
    case "mute_participant":
      return { type: "mute_participant", payload: { peer_id: message.peer_id } };
    case "mute_all":
      return { type: "mute_all", payload: {} };
    case "remove_participant":
      return { type: "remove_participant", payload: { peer_id: message.peer_id } };
    case "grant_permission":
      return {
        type: "grant_permission",
        payload: {
          peer_id: message.peer_id,
          permissions: message.permissions
        }
      };
    case "revoke_permission":
      return { type: "revoke_permission", payload: { peer_id: message.peer_id } };
    case "approve_hand":
      return { type: "approve_hand", payload: { peer_id: message.peer_id } };
    case "promote_moderator":
      return { type: "promote_moderator", payload: { peer_id: message.peer_id } };
    case "transfer_host":
      return {
        type: "transfer_host",
        payload: {
          peer_id: message.peer_id,
          ...message.user_id ? { user_id: message.user_id } : {}
        }
      };
    case "lock_meeting":
      return { type: "lock_meeting", payload: {} };
    case "unlock_meeting":
      return { type: "unlock_meeting", payload: {} };
    case "end_meeting":
      return { type: "end_meeting", payload: {} };
    case "disable_all_cameras":
      return { type: "disable_all_cameras", payload: {} };
    case "start_recording":
      return { type: "start_recording", payload: {} };
    case "stop_recording":
      return { type: "stop_recording", payload: {} };
    case "update_room_settings":
      return { type: "update_room_settings", payload: message.patch };
    case "caption_update":
      return {
        type: "caption_update",
        payload: { text: message.text, final: message.final ?? false }
      };
    case "create_poll":
      return {
        type: "create_poll",
        payload: { question: message.question, options: message.options }
      };
    case "vote_poll":
      return {
        type: "vote_poll",
        payload: { poll_id: message.poll_id, option_id: message.option_id }
      };
    case "close_poll":
      return { type: "close_poll", payload: { poll_id: message.poll_id } };
    case "ask_question":
      return { type: "ask_question", payload: { content: message.content } };
    case "upvote_question":
      return {
        type: "upvote_question",
        payload: { question_id: message.question_id }
      };
    case "answer_question":
      return {
        type: "answer_question",
        payload: { question_id: message.question_id }
      };
    case "dismiss_question":
      return {
        type: "dismiss_question",
        payload: { question_id: message.question_id }
      };
    case "create_breakouts":
      return {
        type: "create_breakouts",
        payload: { count: message.count, names: message.names ?? [] }
      };
    case "assign_breakout":
      return {
        type: "assign_breakout",
        payload: {
          breakout_id: message.breakout_id,
          ...message.peer_id ? { peer_id: message.peer_id } : {}
        }
      };
    case "join_breakout":
      return {
        type: "join_breakout",
        payload: { breakout_id: message.breakout_id }
      };
    case "return_to_main":
      return { type: "return_to_main", payload: {} };
    case "close_breakouts":
      return { type: "close_breakouts", payload: {} };
  }
}
function wireLobbyOutgoing(type, payload) {
  return JSON.stringify({ type, payload });
}
function parseSignalingMessage(raw) {
  try {
    const wire = JSON.parse(raw);
    if (!wire.type) {
      signalingWarn("ignored message without type", raw);
      return null;
    }
    const payload = wire.payload ?? wire;
    switch (wire.type) {
      case "joined":
        return {
          type: "joined",
          stream_id: payload.stream_id,
          peer_id: payload.peer_id
        };
      case "room_joined":
        return {
          type: "room_joined",
          room_id: payload.room_id,
          peer_id: payload.peer_id,
          peers: payload.peers ?? [],
          meeting_mode: payload.meeting_mode,
          session_ver: payload.session_ver,
          publisher_count: payload.publisher_count,
          max_publishers: payload.max_publishers,
          is_recording: payload.is_recording,
          recording_id: payload.recording_id,
          recording_started_at: payload.recording_started_at,
          polls: payload.polls,
          questions: payload.questions,
          breakouts: payload.breakouts,
          breakout_id: payload.breakout_id,
          breakout_name: payload.breakout_name,
          room_settings: payload.room_settings,
          project_features: payload.project_features
        };
      case "peer_joined":
        return {
          type: "peer_joined",
          peer_id: payload.peer_id,
          user_id: payload.user_id,
          username: payload.username,
          role: payload.role,
          permissions: payload.permissions,
          is_audio_muted: payload.is_audio_muted,
          is_video_muted: payload.is_video_muted,
          is_screen_sharing: payload.is_screen_sharing,
          hand_raised: payload.hand_raised
        };
      case "peer_left":
        return { type: "peer_left", peer_id: payload.peer_id };
      case "peer_reconnecting":
        return { type: "peer_reconnecting", peer_id: payload.peer_id };
      case "peer_reconnected":
        return {
          type: "peer_reconnected",
          old_peer_id: payload.old_peer_id,
          peer_id: payload.peer_id,
          username: payload.username
        };
      case "peer_caption":
        return {
          type: "peer_caption",
          peer_id: payload.peer_id,
          username: payload.username,
          text: payload.text,
          final: payload.final
        };
      case "poll_created":
        return {
          type: "poll_created",
          poll: payload
        };
      case "poll_updated":
        return {
          type: "poll_updated",
          poll: payload
        };
      case "poll_closed":
        return { type: "poll_closed", poll_id: payload.poll_id };
      case "question_posted":
        return {
          type: "question_posted",
          question: payload
        };
      case "question_updated":
        return {
          type: "question_updated",
          question: payload
        };
      case "breakouts_created":
        return {
          type: "breakouts_created",
          rooms: payload.rooms ?? []
        };
      case "breakout_assigned":
        return {
          type: "breakout_assigned",
          peer_id: payload.peer_id,
          room: payload.room
        };
      case "breakouts_closed":
        return { type: "breakouts_closed" };
      case "peer_muted":
      case "peer_unmuted":
        return {
          type: "peer_muted",
          peer_id: payload.peer_id,
          kind: payload.kind,
          muted: payload.muted
        };
      case "peer_screen_share":
        return {
          type: "peer_screen_share",
          peer_id: payload.peer_id,
          sharing: payload.sharing
        };
      case "peer_hand_raised":
        return {
          type: "peer_hand_raised",
          peer_id: payload.peer_id,
          raised: payload.raised
        };
      case "peer_reaction":
        return {
          type: "peer_reaction",
          peer_id: payload.peer_id,
          emoji: payload.emoji
        };
      case "permission_updated":
        return {
          type: "permission_updated",
          peer_id: payload.peer_id,
          permissions: payload.permissions
        };
      case "participant_removed":
        return {
          type: "participant_removed",
          peer_id: payload.peer_id
        };
      case "role_updated":
        return {
          type: "role_updated",
          peer_id: payload.peer_id,
          role: payload.role ?? "guest",
          permissions: payload.permissions
        };
      case "meeting_locked":
        return {
          type: "meeting_locked",
          locked: payload.locked
        };
      case "room_settings_updated":
        return {
          type: "room_settings_updated",
          settings: payload
        };
      case "meeting_mode_changed":
        return {
          type: "meeting_mode_changed",
          mode: payload.mode,
          participant_count: payload.participant_count,
          publisher_count: payload.publisher_count ?? 0,
          max_publishers: payload.max_publishers ?? 0
        };
      case "recording_started":
        return {
          type: "recording_started",
          recording_id: payload.recording_id,
          started_at: payload.started_at
        };
      case "recording_stopped":
        return {
          type: "recording_stopped",
          recording_id: payload.recording_id
        };
      case "offer": {
        const sdp = normalizeSdp(payload.sdp) ?? normalizeSdp(payload.offer) ?? normalizeSdp(payload.session_description);
        if (!sdp) {
          signalingWarn("offer missing sdp", payload);
          return null;
        }
        return {
          type: "offer",
          sdp,
          peer_id: payload.peer_id,
          media_peer_id: payload.media_peer_id
        };
      }
      case "track_published": {
        const peerId = payload.peer_id;
        const trackId = payload.track_id;
        const kind = payload.kind;
        if (typeof peerId !== "string" || typeof trackId !== "string") {
          signalingWarn("track_published missing peer_id or track_id", payload);
          return null;
        }
        return {
          type: "track_published",
          peer_id: peerId,
          track_id: trackId,
          kind: typeof kind === "string" ? kind : "video"
        };
      }
      case "ice_candidate": {
        const candidate = payload.candidate;
        if (typeof candidate !== "string" || candidate.length > 16384) {
          signalingWarn("ice_candidate missing or oversized candidate", payload);
          return null;
        }
        return {
          type: "ice_candidate",
          candidate
        };
      }
      case "stream_ended":
        return {
          type: "stream_ended",
          stream_id: payload.stream_id
        };
      case "room_ended":
        return {
          type: "room_ended",
          room_id: payload.room_id
        };
      case "error":
        return {
          type: "error",
          code: payload.code,
          message: payload.message
        };
      case "waiting_room_user_list":
        return {
          type: "waiting_room_user_list",
          state: payload.state ?? "waiting_for_host",
          users: payload.users ?? [],
          updated_at: payload.updated_at
        };
      case "waiting_room_admitted":
        return { type: "waiting_room_admitted" };
      case "waiting_room_rejected":
        return { type: "waiting_room_rejected" };
      case "waiting_room_meeting_started":
        return { type: "waiting_room_meeting_started" };
      default:
        signalingWarn("unsupported message type", wire.type);
        return null;
    }
  } catch (error) {
    signalingWarn("failed to parse message", { raw, error });
    return null;
  }
}
var ERROR_LABELS = {
  sfu_disabled: "WebRTC is unavailable on this server",
  stream_unavailable: "Stream is not live",
  room_unavailable: "Room is not live yet \u2014 wait for the host",
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
  governance_error: "That action could not be completed"
};
var ERROR_DETAILS = {
  sfu_disabled: {
    kind: "connection",
    title: "Video calling unavailable",
    description: "This server does not have WebRTC enabled. Contact the host or try again later.",
    recoverable: false,
    blocking: true
  },
  stream_unavailable: {
    kind: "room",
    title: "Meeting not live",
    description: "The host has not started this meeting yet.",
    recoverable: true,
    blocking: true
  },
  room_unavailable: {
    kind: "room",
    title: "Waiting for the host",
    description: "The meeting has not started yet. Stay on this page and you'll join automatically when the host opens the room.",
    recoverable: true,
    blocking: false
  },
  room_start_failed: {
    kind: "room",
    title: "Could not start the meeting",
    description: "We couldn't bring the room online. Check your connection and try again.",
    recoverable: true,
    blocking: true
  },
  payment_required: {
    kind: "permission",
    title: "Access required",
    description: "You need access to join this meeting. Complete payment or request access from the host.",
    recoverable: false,
    blocking: true
  },
  not_found: {
    kind: "room",
    title: "Meeting not found",
    description: "This room may have been deleted or the link is incorrect.",
    recoverable: false,
    blocking: true
  },
  sfu_error: {
    kind: "connection",
    title: "Could not connect audio & video",
    description: "Your browser couldn't establish a media session. Try again or join without camera and microphone first.",
    recoverable: true,
    blocking: true
  },
  join_failed: {
    kind: "connection",
    title: "Couldn't join the meeting",
    description: "Something went wrong while joining. Check your network and try again.",
    recoverable: true,
    blocking: true
  },
  reconnect_failed: {
    kind: "connection",
    title: "Reconnection failed",
    description: "We couldn't restore your session after a disconnect. Try joining again.",
    recoverable: true,
    blocking: false
  },
  waiting_room_not_admitted: {
    kind: "waiting",
    title: "Waiting for admission",
    description: "The host has not admitted you yet. You'll join automatically once approved.",
    recoverable: true,
    blocking: false
  },
  waiting_room_disabled: {
    kind: "waiting",
    title: "Waiting room unavailable",
    description: "This meeting is not using a waiting room. Try joining again.",
    recoverable: true,
    blocking: false
  },
  invalid_state: {
    kind: "connection",
    title: "Session out of sync",
    description: "Your connection lost track of the meeting. Rejoin to continue.",
    recoverable: true,
    blocking: false
  },
  access_error: {
    kind: "permission",
    title: "Access check failed",
    description: "We couldn't verify your access to this meeting. Try again in a moment.",
    recoverable: true,
    blocking: false
  },
  forbidden: {
    kind: "permission",
    title: "Action not allowed",
    description: "You don't have permission to perform that action in this meeting.",
    recoverable: false,
    blocking: false
  },
  permission_denied: {
    kind: "permission",
    title: "Microphone or camera blocked",
    description: "Your role does not allow publishing right now. Ask the host for permission.",
    recoverable: false,
    blocking: false
  },
  publisher_limit: {
    kind: "permission",
    title: "Speaker limit reached",
    description: "The maximum number of active speakers has been reached.",
    recoverable: false,
    blocking: false
  },
  governance_error: {
    kind: "room",
    title: "Action could not be completed",
    description: "That action could not be completed. Try again or ask the host.",
    recoverable: false,
    blocking: false
  },
  recording_active: {
    kind: "room",
    title: "Recording in progress",
    description: "This meeting is already being recorded.",
    recoverable: true,
    blocking: false
  },
  recording_not_active: {
    kind: "room",
    title: "No active recording",
    description: "There is no recording running for this meeting.",
    recoverable: true,
    blocking: false
  },
  recording_disabled: {
    kind: "room",
    title: "Recording unavailable",
    description: "Recording is not enabled for this meeting.",
    recoverable: false,
    blocking: false
  },
  recording_unavailable: {
    kind: "room",
    title: "Recording unavailable",
    description: "Recording could not start because no participants are connected to the media server yet.",
    recoverable: true,
    blocking: false
  }
};
var FATAL_BLOCKING_CODES = /* @__PURE__ */ new Set([
  "sfu_disabled",
  "not_found",
  "payment_required"
]);
function isMeetingErrorBlocking(error, inSession) {
  if (error.blocking === false) return false;
  if (error.kind === "removed") return true;
  if (/room ended|meeting ended/i.test(`${error.title} ${error.description}`)) {
    return true;
  }
  if (inSession && !FATAL_BLOCKING_CODES.has(error.code ?? "")) {
    return false;
  }
  return true;
}
var MESSAGE_PATTERNS = [
  {
    match: /timed out waiting to join/i,
    error: {
      kind: "connection",
      title: "Join timed out",
      description: "The meeting took too long to respond. Check your connection and try again.",
      recoverable: true,
      blocking: true
    }
  },
  {
    match: /webrtc connection failed/i,
    error: {
      kind: "connection",
      title: "Connection lost",
      description: "Your media connection dropped. Try rejoining the meeting.",
      recoverable: true,
      blocking: false
    }
  },
  {
    match: /camera\/microphone permission denied|permission denied/i,
    error: {
      kind: "media",
      title: "Camera or microphone blocked",
      description: "Allow camera and microphone access in your browser settings, then try joining again.",
      recoverable: true,
      blocking: true
    }
  },
  {
    match: /unable to access camera\/mic/i,
    error: {
      kind: "media",
      title: "Camera or microphone blocked",
      description: "Allow camera and microphone access in your browser settings, then try again.",
      recoverable: true,
      blocking: false
    }
  },
  {
    match: /removed from the meeting/i,
    error: {
      kind: "removed",
      title: "You were removed",
      description: "The host removed you from this meeting.",
      recoverable: false,
      blocking: true
    }
  },
  {
    match: /room ended/i,
    error: {
      kind: "room",
      title: "Meeting ended",
      description: "The host has ended this meeting for everyone.",
      recoverable: false,
      blocking: true
    }
  },
  {
    match: /rejected by the host/i,
    error: {
      kind: "waiting",
      title: "Admission denied",
      description: "The host did not admit you to this meeting.",
      recoverable: false,
      blocking: true
    }
  },
  {
    match: /room id is required/i,
    error: {
      kind: "room",
      title: "Invalid room",
      description: "This meeting link is missing a room identifier.",
      recoverable: false,
      blocking: true
    }
  }
];
function resolveMeetingError(input) {
  const code = input.code?.trim();
  const message = input.message?.trim() ?? "";
  if (code && ERROR_DETAILS[code]) {
    const detail = ERROR_DETAILS[code];
    return { code, ...detail };
  }
  if (code && ERROR_LABELS[code]) {
    return {
      code,
      kind: code === "forbidden" || code === "permission_denied" ? "permission" : "unknown",
      title: "Something went wrong",
      description: ERROR_LABELS[code],
      recoverable: true,
      blocking: code === "forbidden" || code === "permission_denied" || code === "publisher_limit" ? false : true
    };
  }
  for (const pattern of MESSAGE_PATTERNS) {
    const matches = typeof pattern.match === "string" ? message.toLowerCase().includes(pattern.match.toLowerCase()) : pattern.match.test(message);
    if (matches) {
      return { ...pattern.error, code, description: message || pattern.error.description };
    }
  }
  if (message) {
    return {
      code,
      kind: "unknown",
      title: "Something went wrong",
      description: message,
      recoverable: true,
      blocking: false
    };
  }
  return {
    code,
    kind: "connection",
    title: "Connection problem",
    description: "We couldn't connect to the meeting. Please try again.",
    recoverable: true,
    blocking: true
  };
}
function signalingErrorMessage(message) {
  if (message.type !== "error") return "Signaling connection failed";
  if (message.message?.trim()) {
    return message.message.trim();
  }
  if (message.code && ERROR_LABELS[message.code]) {
    return ERROR_LABELS[message.code];
  }
  return message.message ?? "Signaling connection failed";
}
function signalingErrorViewModel(message) {
  if (message.type !== "error") {
    return resolveMeetingError({ message: "Signaling connection failed" });
  }
  return resolveMeetingError({
    code: message.code,
    message: signalingErrorMessage(message)
  });
}
function serializeIceCandidate(candidate) {
  return JSON.stringify(candidate.toJSON());
}
function participantHasDisplayableVideo(participant) {
  if (participant.videoOff) return false;
  return participant.stream?.getVideoTracks().some(
    (track) => track.readyState === "live" && track.enabled && !track.muted
  ) ?? false;
}
function stopMediaStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}
function mergeRemoteTrack(existing, track) {
  const stream = new MediaStream(existing ? existing.getTracks() : []);
  const sameKind = stream.getTracks().find((item) => item.kind === track.kind);
  if (sameKind) {
    if (sameKind.id === track.id) {
      return stream;
    }
    stream.removeTrack(sameKind);
  }
  stream.addTrack(track);
  return stream;
}
var MAX_SDP_LENGTH = 512e3;
function normalizeSdpText(sdp) {
  let text = sdp.trim().replace(/\\n/g, "\n").replace(/\\r/g, "\r");
  const hasLineBreaks = /\r?\n/.test(text);
  if (!hasLineBreaks) {
    if (text.includes(" a=")) {
      text = text.replace(/ a=/g, "\na=");
    }
    if (!text.includes("\n") && text.includes(" ")) {
      text = text.replace(/^v=0 /, "v=0\n").replace(/ o=/, "\no=").replace(/ s=/, "\ns=").replace(/ t=/, "\nt=").replace(/ m=/g, "\nm=");
    }
  }
  return `${text.replace(/\r?\n/g, "\r\n").trim()}\r
`;
}
function repairSdpForNegotiation(sdp) {
  const lines = normalizeSdpText(sdp).replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).filter((line) => line.length > 0);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^a=fingerprint:(\S+)\s+(.+)$/);
    if (match) {
      lines[i] = `a=fingerprint:${match[1]} ${match[2].toLowerCase()}`;
    }
  }
  const firstMedia = lines.findIndex((line) => line.startsWith("m="));
  if (firstMedia === -1) {
    return `${lines.join("\r\n")}\r
`;
  }
  const mediaLines = lines.slice(firstMedia);
  const mediaHasFingerprint = mediaLines.some(
    (line) => line.startsWith("a=fingerprint:")
  );
  if (!mediaHasFingerprint) {
    return `${lines.join("\r\n")}\r
`;
  }
  const redundantSessionAttrs = [
    "a=fingerprint:",
    "a=setup:",
    "a=ice-ufrag:",
    "a=ice-pwd:"
  ];
  const repaired = lines.filter((line, index) => {
    if (index >= firstMedia) return true;
    if (!line.startsWith("a=")) return true;
    return !redundantSessionAttrs.some((prefix) => line.startsWith(prefix));
  });
  return `${repaired.join("\r\n")}\r
`;
}
function sanitizeSdpSafe(sdp) {
  if (sdp.length > MAX_SDP_LENGTH) {
    throw new Error("SDP payload exceeds maximum allowed size");
  }
  const normalized = repairSdpForNegotiation(sdp);
  if (!normalized.startsWith("v=")) {
    throw new Error("SDP must start with v=0");
  }
  return normalized;
}
function isValidIceCandidateInit(init) {
  if (!init || typeof init !== "object") return false;
  if (init.candidate === "" || init.candidate === void 0) return true;
  if (typeof init.candidate !== "string") return false;
  if (init.candidate.length > 8192) return false;
  return true;
}
function parseIceCandidateInit(candidateJson) {
  if (!candidateJson || candidateJson.length > 16384) return null;
  try {
    const parsed = JSON.parse(candidateJson);
    if (!isValidIceCandidateInit(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function analyzeSdp(sdp) {
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
      lineCount: 0
    };
  }
  const lines = sdp.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const mediaLines = lines.filter((l) => l.startsWith("m="));
  return {
    hasIceUfrag: lines.some((l) => l.startsWith("a=ice-ufrag:")),
    hasIcePwd: lines.some((l) => l.startsWith("a=ice-pwd:")),
    hasFingerprint: lines.some((l) => l.startsWith("a=fingerprint:")),
    hasSetup: lines.some((l) => l.startsWith("a=setup:")),
    mediaLines: mediaLines.length,
    audioLines: mediaLines.filter((l) => l.startsWith("m=audio")).length,
    videoLines: mediaLines.filter((l) => l.startsWith("m=video")).length,
    hasSendrecv: lines.some((l) => l.includes("a=sendrecv")),
    hasRecvonly: lines.some((l) => l.includes("a=recvonly")),
    hasSendonly: lines.some((l) => l.includes("a=sendonly")),
    lineCount: lines.length
  };
}
function validateRoomModeSdp(sdp, context) {
  const critical = [];
  const warnings = [];
  const info = analyzeSdp(sdp);
  if (!sdp.startsWith("v=")) {
    critical.push("SDP does not start with v=0");
  }
  if (info.mediaLines === 0) {
    critical.push("No media sections found");
  }
  if (!info.hasFingerprint && !info.hasSetup && !info.hasIceUfrag) {
    critical.push("Missing DTLS/ICE attributes");
  }
  if (!info.hasIceUfrag) warnings.push("Missing ice-ufrag attribute");
  if (!info.hasIcePwd) warnings.push("Missing ice-pwd attribute");
  if (!info.hasFingerprint) warnings.push("Missing fingerprint attribute");
  if (info.hasRecvonly && context === "offer" && !info.hasSendrecv) {
    warnings.push("SDP contains recvonly \u2014 bidirectional room mode expects sendrecv");
  }
  if (info.hasRecvonly && context === "answer" && !info.hasSendrecv) {
    warnings.push(
      "answer is recvonly only \u2014 local camera/mic may not be published"
    );
  }
  if (info.audioLines === 0) warnings.push("No audio media section");
  if (info.videoLines === 0) warnings.push("No video media section");
  return {
    valid: critical.length === 0,
    critical,
    warnings
  };
}
function logSdpAnalysis(sdp, label, context = "offer") {
  const info = analyzeSdp(sdp);
  const validation = validateRoomModeSdp(sdp, context);
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
      sendonly: info.hasSendonly
    },
    valid: validation.valid,
    critical: validation.critical,
    warnings: validation.warnings
  });
  for (const issue of validation.critical) {
    signalingWarn(`${label} SDP critical: ${issue}`);
  }
  for (const issue of validation.warnings) {
    signalingWarn(`${label} SDP warning: ${issue}`);
  }
}

// src/signaling/video-quality.ts
var DEFAULT_VIDEO_QUALITY_TIER = "hd1080";
var DEFAULT_VIDEO_QUALITY_MODE = "adaptive-high";
var VIDEO_QUALITY_TIER_ORDER = [
  "sd360",
  "sd480",
  "hd720",
  "hd1080"
];
var VIDEO_QUALITY_PROFILES = {
  hd1080: {
    tier: "hd1080",
    label: "1080p",
    captureConstraints: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: "user"
    },
    encodingParams: {
      maxBitrate: 55e5,
      maxFramerate: 30,
      scaleResolutionDownBy: 1
    }
  },
  hd720: {
    tier: "hd720",
    label: "720p",
    captureConstraints: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: "user"
    },
    encodingParams: {
      maxBitrate: 3e6,
      maxFramerate: 30,
      scaleResolutionDownBy: 1
    }
  },
  sd480: {
    tier: "sd480",
    label: "480p",
    captureConstraints: {
      width: { ideal: 854, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: "user"
    },
    encodingParams: {
      maxBitrate: 8e5,
      maxFramerate: 24,
      scaleResolutionDownBy: 1.5
    }
  },
  sd360: {
    tier: "sd360",
    label: "360p",
    captureConstraints: {
      width: { ideal: 640, max: 854 },
      height: { ideal: 360, max: 480 },
      frameRate: { ideal: 20, max: 24 },
      facingMode: "user"
    },
    encodingParams: {
      maxBitrate: 4e5,
      maxFramerate: 20,
      scaleResolutionDownBy: 2
    }
  }
};
var SCREEN_SHARE_ENCODING = {
  maxBitrate: 6e6,
  maxFramerate: 30,
  scaleResolutionDownBy: 1,
  contentHint: "detail"
};
var DEFAULT_CAMERA_VIDEO_CONSTRAINTS = VIDEO_QUALITY_PROFILES.hd1080.captureConstraints;
function getVideoQualityProfile(tier) {
  return VIDEO_QUALITY_PROFILES[tier];
}
function getVideoQualityLabel(tier) {
  return VIDEO_QUALITY_PROFILES[tier].label;
}
function isCameraVideoTrack(track) {
  if (track.kind !== "video") return false;
  return track.getSettings().displaySurface === void 0;
}
function isScreenShareVideoTrack(track) {
  if (track.kind !== "video") return false;
  return track.getSettings().displaySurface !== void 0;
}

export {
  DEFAULT_TOKEN_PATH,
  resolveWsUrlFromPublishKey,
  readPublishKeyFromEnv,
  setTalkieTalkerStreamConfig,
  getTalkieTalkerStreamConfig,
  getWsBaseUrl,
  themeToCssVars,
  applyCustomCss,
  sanitizeDisplayName,
  signalingLog,
  signalingWarn,
  buildSignalingWsUrl,
  resolveAccessToken2 as resolveAccessToken,
  normalizeSdp,
  wireOutgoing,
  wireLobbyOutgoing,
  parseSignalingMessage,
  isMeetingErrorBlocking,
  resolveMeetingError,
  signalingErrorMessage,
  signalingErrorViewModel,
  serializeIceCandidate,
  participantHasDisplayableVideo,
  stopMediaStream,
  mergeRemoteTrack,
  normalizeSdpText,
  repairSdpForNegotiation,
  sanitizeSdpSafe,
  isValidIceCandidateInit,
  parseIceCandidateInit,
  analyzeSdp,
  validateRoomModeSdp,
  logSdpAnalysis,
  DEFAULT_VIDEO_QUALITY_TIER,
  DEFAULT_VIDEO_QUALITY_MODE,
  VIDEO_QUALITY_TIER_ORDER,
  VIDEO_QUALITY_PROFILES,
  SCREEN_SHARE_ENCODING,
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
  getVideoQualityProfile,
  getVideoQualityLabel,
  isCameraVideoTrack,
  isScreenShareVideoTrack
};
//# sourceMappingURL=chunk-7OFM7NYG.js.map