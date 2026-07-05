export type RoomSessionOptions = {
  displayName?: string
  token?: string
  wsUrl?: string
  userId?: string
  isHost?: boolean
  lobbyUserId?: string
  mediaConstraints?: MediaStreamConstraints
  initialMicMuted?: boolean
  initialVideoOff?: boolean
  joinWithoutMedia?: boolean
  initialRoomSettings?: RoomSettings
  onStageReaction?: (event: {
    peerId: string
    username: string
    emoji: string
    at: number
  }) => void
}

export type MeetingRole = "host" | "moderator" | "registered" | "guest"
export type MeetingMode = "interactive" | "large"

export interface RoomSettings {
  waiting_room_enabled: boolean
  guest_can_chat: boolean
  guest_can_react: boolean
  guest_can_raise_hand: boolean
  polls_enabled: boolean
  qa_enabled: boolean
  breakouts_enabled: boolean
  is_recording_enabled: boolean
}

export type RoomSettingsPatch = Partial<
  Pick<
    RoomSettings,
    | "waiting_room_enabled"
    | "guest_can_chat"
    | "guest_can_react"
    | "guest_can_raise_hand"
    | "polls_enabled"
    | "qa_enabled"
    | "breakouts_enabled"
  >
>

export interface PermissionSet {
  microphone: boolean
  camera: boolean
  screen_share: boolean
  publish: boolean
}

export interface SignalingPeerInfo {
  peer_id: string
  user_id?: string
  username?: string
  role?: MeetingRole
  permissions?: PermissionSet
  is_audio_muted?: boolean
  is_video_muted?: boolean
  is_screen_sharing?: boolean
  hand_raised?: boolean
}

export type ConnectionQuality = "excellent" | "good" | "poor" | "bad" | "unknown"

export interface SignalingParticipant {
  id: string
  username: string
  stream: MediaStream | null
  isLocal: boolean
  isHost: boolean
  role?: MeetingRole
  permissions?: PermissionSet
  audioMuted: boolean
  videoOff: boolean
  isScreenSharing: boolean
  handRaised: boolean
  reaction: string | null
  connectionQuality: ConnectionQuality
  videoQualityLabel?: string
  inboundVideoLabel?: string
}

export type SignalingOutgoingMessage =
  | { type: "join"; stream_id: string }
  | { type: "join_room"; room_id: string; username?: string; lobby_user_id?: string }
  | { type: "reconnect_room"; room_id: string; username?: string; lobby_user_id?: string }
  | { type: "answer"; sdp: string }
  | { type: "ice_candidate"; candidate: string }
  | { type: "mute_audio" }
  | { type: "unmute_audio" }
  | { type: "mute_video" }
  | { type: "unmute_video" }
  | { type: "screen_share_start" }
  | { type: "screen_share_stop" }
  | { type: "raise_hand" }
  | { type: "lower_hand" }
  | { type: "reaction"; emoji: string }
  | { type: "mute_participant"; peer_id: string }
  | { type: "mute_all" }
  | { type: "remove_participant"; peer_id: string }
  | { type: "grant_permission"; peer_id: string; permissions: PermissionSet }
  | { type: "revoke_permission"; peer_id: string }
  | { type: "approve_hand"; peer_id: string }
  | { type: "promote_moderator"; peer_id: string }
  | { type: "transfer_host"; peer_id: string; user_id?: string }
  | { type: "lock_meeting" }
  | { type: "unlock_meeting" }
  | { type: "end_meeting" }
  | { type: "disable_all_cameras" }
  | { type: "start_recording" }
  | { type: "stop_recording" }
  | { type: "update_room_settings"; patch: RoomSettingsPatch }
  | { type: "leave" }
  | { type: "leave_room" }
  | { type: "caption_update"; text: string; final?: boolean }
  | { type: "create_poll"; question: string; options: string[] }
  | { type: "vote_poll"; poll_id: string; option_id: string }
  | { type: "close_poll"; poll_id: string }
  | { type: "ask_question"; content: string }
  | { type: "upvote_question"; question_id: string }
  | { type: "answer_question"; question_id: string }
  | { type: "dismiss_question"; question_id: string }
  | { type: "create_breakouts"; count: number; names?: string[] }
  | { type: "assign_breakout"; breakout_id: string; peer_id?: string }
  | { type: "join_breakout"; breakout_id: string }
  | { type: "return_to_main" }
  | { type: "close_breakouts" }

export interface MeetingPollOption {
  id: string
  label: string
  vote_count: number
}

export interface MeetingPoll {
  id: string
  question: string
  status: string
  options: MeetingPollOption[]
}

export interface MeetingQuestion {
  id: string
  author_peer_id: string
  author_username: string
  content: string
  upvotes: number
  answered: boolean
}

export interface BreakoutRoom {
  id: string
  name: string
}

export type ProjectFeaturesPayload = {
  chat: boolean
  screen_share: boolean
  recording: boolean
  waiting_room: boolean
  breakouts: boolean
  reactions: boolean
}

export type SignalingIncomingMessage =
  | { type: "joined"; stream_id?: string; peer_id?: string }
  | {
      type: "room_joined"
      room_id: string
      peer_id: string
      peers: SignalingPeerInfo[]
      meeting_mode?: MeetingMode
      session_ver?: number
      publisher_count?: number
      max_publishers?: number
      is_recording?: boolean
      recording_id?: string
      recording_started_at?: number
      polls?: MeetingPoll[]
      questions?: MeetingQuestion[]
      breakouts?: BreakoutRoom[]
      breakout_id?: string
      breakout_name?: string
      room_settings?: RoomSettings
      project_features?: ProjectFeaturesPayload
    }
  | {
      type: "peer_joined"
      peer_id: string
      username?: string
      user_id?: string
      role?: MeetingRole
      permissions?: PermissionSet
      is_audio_muted?: boolean
      is_video_muted?: boolean
      is_screen_sharing?: boolean
      hand_raised?: boolean
    }
  | { type: "peer_left"; peer_id: string }
  | { type: "peer_reconnecting"; peer_id: string }
  | { type: "peer_reconnected"; old_peer_id: string; peer_id: string; username?: string }
  | {
      type: "peer_caption"
      peer_id: string
      username?: string
      text: string
      final?: boolean
    }
  | { type: "poll_created"; poll: MeetingPoll }
  | { type: "poll_updated"; poll: MeetingPoll }
  | { type: "poll_closed"; poll_id: string }
  | { type: "question_posted"; question: MeetingQuestion }
  | { type: "question_updated"; question: MeetingQuestion }
  | { type: "breakouts_created"; rooms: BreakoutRoom[] }
  | {
      type: "breakout_assigned"
      peer_id: string
      room: BreakoutRoom
    }
  | { type: "breakouts_closed" }
  | { type: "peer_muted"; peer_id: string; kind: "audio" | "video"; muted: boolean }
  | { type: "peer_screen_share"; peer_id: string; sharing: boolean }
  | { type: "peer_hand_raised"; peer_id: string; raised: boolean }
  | { type: "peer_reaction"; peer_id: string; emoji: string }
  | {
      type: "permission_updated"
      peer_id: string
      permissions: PermissionSet
    }
  | { type: "participant_removed"; peer_id: string }
  | {
      type: "role_updated"
      peer_id: string
      role: MeetingRole
      permissions?: PermissionSet
    }
  | { type: "meeting_locked"; locked: boolean }
  | { type: "room_settings_updated"; settings: RoomSettings }
  | {
      type: "meeting_mode_changed"
      mode: MeetingMode
      participant_count?: number
      publisher_count: number
      max_publishers: number
    }
  | {
      type: "recording_started"
      recording_id: string
      started_at?: number
    }
  | { type: "recording_stopped"; recording_id: string }
  | { type: "offer"; sdp: string; peer_id?: string; media_peer_id?: string }
  | {
      type: "track_published"
      peer_id: string
      track_id: string
      kind: "audio" | "video" | string
    }
  | { type: "ice_candidate"; candidate: string }
  | { type: "stream_ended"; stream_id?: string }
  | { type: "room_ended"; room_id?: string }
  | { type: "error"; code?: string; message?: string }
  | { type: "waiting_room_user_list"; users: WaitingRoomUserInfo[]; state: string; updated_at?: number }
  | { type: "waiting_room_admitted" }
  | { type: "waiting_room_rejected" }
  | { type: "waiting_room_meeting_started" }

export interface WaitingRoomUserInfo {
  user_id: string
  username: string
  state: "waiting" | "admitted" | "connected"
  joined_at: number
}

export interface ParsedStats {
  audioPacketsLost: number
  videoPacketsLost: number
  audioJitter: number
  videoFrameRate: number
  roundTripTime: number
  availableOutgoingBitrate: number
  currentResolution: string
  inboundVideoResolution: string
  inboundVideoResolutionsByTrackId: Record<string, string>
  outboundVideoRetransmissions: number
  timestamp: number
  /** Packets lost since the previous stats poll. */
  lossDelta?: number
}

export interface SimulcastLayer {
  rid: string
  maxBitrate: number
  scaleResolutionDownBy: number
}

export const SIMULCAST_LAYERS: SimulcastLayer[] = [
  { rid: "q", maxBitrate: 150_000, scaleResolutionDownBy: 4.0 },
  { rid: "h", maxBitrate: 500_000, scaleResolutionDownBy: 2.0 },
  { rid: "f", maxBitrate: 2_500_000, scaleResolutionDownBy: 1.0 },
]

function parseEnvList(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildIceServers(): RTCIceServer[] {
  const stunUrls = parseEnvList(process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS)
  const turnUrls = parseEnvList(process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS)
  const username = process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME
  const credential = process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL

  const servers: RTCIceServer[] = []

  for (const url of stunUrls ?? []) {
    servers.push({ urls: url })
  }

  for (const url of turnUrls ?? []) {
    servers.push({
      urls: url,
      username: username || undefined,
      credential: credential || undefined,
    })
  }

  if (servers.length > 0) return servers

  return [
    { urls: "stun:localhost:3478" },
    {
      urls: "turn:localhost:3478",
      username: "turnuser",
      credential: "turnpass",
    },
  ]
}

export const DEFAULT_ICE_SERVERS = buildIceServers()

export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: DEFAULT_ICE_SERVERS,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 10,
}
