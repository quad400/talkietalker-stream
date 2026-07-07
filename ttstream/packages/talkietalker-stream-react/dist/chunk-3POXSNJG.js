import {
  PeerConnectionManager,
  ROOM_PEER_CONNECTION_OPTIONS
} from "./chunk-VWJHHDJX.js";
import {
  mediaDeviceManager
} from "./chunk-VHZN6RVW.js";
import {
  buildAudioOnlyConstraints,
  buildVideoOnlyConstraints
} from "./chunk-Q42ZYZTW.js";
import {
  DEFAULT_VIDEO_QUALITY_MODE,
  DEFAULT_VIDEO_QUALITY_TIER,
  VIDEO_QUALITY_TIER_ORDER,
  buildSignalingWsUrl,
  getVideoQualityLabel,
  getVideoQualityProfile,
  isMeetingErrorBlocking,
  mergeRemoteTrack,
  parseSignalingMessage,
  participantHasDisplayableVideo,
  resolveAccessToken,
  resolveMeetingError,
  sanitizeDisplayName,
  serializeIceCandidate,
  signalingErrorViewModel,
  signalingLog,
  signalingWarn,
  stopMediaStream,
  wireOutgoing
} from "./chunk-7OFM7NYG.js";

// src/signaling/video-quality-preference.ts
var STORAGE_KEY = "stream:video-quality-mode";
function readVideoQualityMode() {
  if (typeof window === "undefined") return DEFAULT_VIDEO_QUALITY_MODE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "max" || stored === "adaptive-high") {
    return stored;
  }
  return DEFAULT_VIDEO_QUALITY_MODE;
}
function writeVideoQualityMode(mode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
var VIDEO_QUALITY_MODE_OPTIONS = [
  {
    value: "adaptive-high",
    label: "High (recommended)",
    description: "Start at 1080p and reduce only on sustained poor network"
  },
  {
    value: "max",
    label: "Max",
    description: "Pin 1080p and disable adaptive downgrades"
  }
];

// src/signaling/use-signaling-socket.ts
import * as React from "react";
var INITIAL_RECONNECT_DELAY_MS = 500;
var MAX_RECONNECT_DELAY_MS = 1e4;
var MAX_RECONNECT_ATTEMPTS = 5;
function useSignalingSocket(enabled, onMessage, onOpen, options) {
  const wsRef = React.useRef(null);
  const queueRef = React.useRef([]);
  const messageChainRef = React.useRef(Promise.resolve());
  const connectionIdRef = React.useRef(0);
  const reconnectTimerRef = React.useRef(null);
  const reconnectAttemptRef = React.useRef(0);
  const reconnectDelayRef = React.useRef(INITIAL_RECONNECT_DELAY_MS);
  const intentionalCloseRef = React.useRef(false);
  const onMessageRef = React.useRef(onMessage);
  const onOpenRef = React.useRef(onOpen);
  const onReconnectRef = React.useRef(options?.onReconnect);
  const onErrorRef = React.useRef(options?.onError);
  const autoReconnectRef = React.useRef(options?.autoReconnect !== false);
  const tokenRef = React.useRef(options?.token);
  const wsUrlRef = React.useRef(options?.wsUrl);
  React.useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onReconnectRef.current = options?.onReconnect;
    onErrorRef.current = options?.onError;
    autoReconnectRef.current = options?.autoReconnect !== false;
    tokenRef.current = options?.token;
    wsUrlRef.current = options?.wsUrl;
  }, [onMessage, onOpen, options?.onReconnect, options?.onError, options?.autoReconnect, options?.token, options?.wsUrl]);
  const clearReconnectTimer = React.useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);
  const resetReconnectState = React.useCallback(() => {
    reconnectAttemptRef.current = 0;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
    clearReconnectTimer();
  }, [clearReconnectTimer]);
  const connect = React.useCallback(
    (connectionId) => {
      void (async () => {
        const token = tokenRef.current ?? await resolveAccessToken();
        const url = buildSignalingWsUrl(token, wsUrlRef.current);
        signalingLog("connecting", url.replace(/token=[^&]+/, "token=***"));
        const ws = new WebSocket(url);
        wsRef.current = ws;
        messageChainRef.current = Promise.resolve();
        ws.onopen = () => {
          if (connectionId !== connectionIdRef.current) return;
          const isReconnect = reconnectAttemptRef.current > 0;
          if (isReconnect) {
            signalingLog("reconnected after abnormal close");
            onReconnectRef.current?.();
          }
          signalingLog("connected");
          resetReconnectState();
          for (const queued of queueRef.current) {
            ws.send(queued);
          }
          queueRef.current = [];
          onOpenRef.current?.();
        };
        ws.onmessage = (event) => {
          if (connectionId !== connectionIdRef.current) return;
          const message = parseSignalingMessage(String(event.data));
          if (!message) return;
          signalingLog("received", message.type);
          messageChainRef.current = messageChainRef.current.then(() => onMessageRef.current(message)).catch((error) => {
            const text = error instanceof Error ? error.message : "Signaling handler failed";
            signalingWarn("handler error", error);
            onErrorRef.current?.(text);
          });
        };
        ws.onerror = () => {
          if (connectionId !== connectionIdRef.current) return;
          signalingWarn("websocket error");
        };
        ws.onclose = (event) => {
          if (connectionId !== connectionIdRef.current) return;
          signalingLog("closed", { code: event.code, reason: event.reason });
          if (intentionalCloseRef.current) return;
          const isAbnormal = event.code !== 1e3 && event.code !== 1001 && event.code !== 1005;
          if (isAbnormal && autoReconnectRef.current && reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptRef.current++;
            const delay = reconnectDelayRef.current;
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * 2,
              MAX_RECONNECT_DELAY_MS
            );
            signalingLog(
              `scheduling reconnect ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
            );
            reconnectTimerRef.current = setTimeout(() => {
              if (connectionId === connectionIdRef.current) {
                connect(connectionId);
              }
            }, delay);
            return;
          }
          if (isAbnormal) {
            onErrorRef.current?.(
              event.reason || `Signaling connection closed (${event.code})`
            );
          }
        };
      })();
    },
    [resetReconnectState]
  );
  React.useEffect(() => {
    if (!enabled) return;
    const connectionId = ++connectionIdRef.current;
    intentionalCloseRef.current = false;
    resetReconnectState();
    connect(connectionId);
    return () => {
      if (connectionId !== connectionIdRef.current) return;
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      wsRef.current?.close();
      if (wsRef.current) wsRef.current = null;
      queueRef.current = [];
      messageChainRef.current = Promise.resolve();
    };
  }, [clearReconnectTimer, connect, enabled, resetReconnectState]);
  const send = React.useCallback((message) => {
    const serialized = JSON.stringify(wireOutgoing(message));
    signalingLog("send", message.type);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized);
    } else {
      queueRef.current.push(serialized);
    }
  }, []);
  const close = React.useCallback(() => {
    intentionalCloseRef.current = true;
    connectionIdRef.current += 1;
    clearReconnectTimer();
    wsRef.current?.close();
    wsRef.current = null;
    queueRef.current = [];
    messageChainRef.current = Promise.resolve();
  }, [clearReconnectTimer]);
  return { send, close };
}

// src/signaling/use-room-session.ts
import * as React2 from "react";

// src/signaling/adaptive-video-quality.ts
var UPGRADE_GOOD_POLLS_REQUIRED = 1;
var DOWNGRADE_POLLS_REQUIRED = 4;
var BITRATE_HEADROOM_RATIO = 0.8;
var TIER_CHANGE_COOLDOWN_MS = 1e4;
var JOIN_GRACE_MS = 2e4;
var AdaptiveVideoQualityController = class {
  currentTier = DEFAULT_VIDEO_QUALITY_TIER;
  consecutiveGoodPolls = 0;
  consecutivePoorPolls = 0;
  consecutiveBadPolls = 0;
  consecutiveBitrateStressPolls = 0;
  lastTierChangeAt = 0;
  graceUntil = Date.now() + JOIN_GRACE_MS;
  onTierChange;
  mode;
  constructor(onTierChange, mode = "adaptive-high") {
    this.onTierChange = onTierChange;
    this.mode = mode;
  }
  get tier() {
    return this.currentTier;
  }
  setMode(mode) {
    this.mode = mode;
    if (mode === "max") {
      this.currentTier = "hd1080";
    }
  }
  reset() {
    this.currentTier = DEFAULT_VIDEO_QUALITY_TIER;
    this.consecutiveGoodPolls = 0;
    this.consecutivePoorPolls = 0;
    this.consecutiveBadPolls = 0;
    this.consecutiveBitrateStressPolls = 0;
    this.lastTierChangeAt = 0;
    this.graceUntil = Date.now() + JOIN_GRACE_MS;
  }
  onSessionConnected() {
    this.currentTier = DEFAULT_VIDEO_QUALITY_TIER;
    this.consecutiveGoodPolls = 0;
    this.consecutivePoorPolls = 0;
    this.consecutiveBadPolls = 0;
    this.consecutiveBitrateStressPolls = 0;
    this.lastTierChangeAt = 0;
    this.graceUntil = Date.now() + JOIN_GRACE_MS;
  }
  evaluate(stats, quality, pcm, options = {}) {
    if (options.skip) return;
    if (this.mode === "max") {
      if (this.currentTier !== "hd1080") {
        void pcm.applyVideoQualityTier("hd1080", options.videoTrack).then((applied) => {
          if (!applied) return;
          this.currentTier = "hd1080";
          this.onTierChange?.("hd1080");
        });
      }
      return;
    }
    const targetTier = this.selectTargetTier(stats, quality);
    if (targetTier === this.currentTier) return;
    if (Date.now() - this.lastTierChangeAt < TIER_CHANGE_COOLDOWN_MS) {
      return;
    }
    void pcm.applyVideoQualityTier(targetTier, options.videoTrack).then((applied) => {
      if (!applied) return;
      this.currentTier = targetTier;
      this.lastTierChangeAt = Date.now();
      this.onTierChange?.(targetTier);
    });
  }
  selectTargetTier(stats, quality) {
    const inGrace = Date.now() < this.graceUntil;
    if (quality === "bad") {
      this.consecutiveBadPolls += 1;
      this.consecutivePoorPolls = 0;
      this.consecutiveGoodPolls = 0;
      this.consecutiveBitrateStressPolls = 0;
    } else if (quality === "poor") {
      this.consecutivePoorPolls += 1;
      this.consecutiveBadPolls = 0;
      this.consecutiveGoodPolls = 0;
      this.consecutiveBitrateStressPolls = 0;
    } else if (quality === "good" || quality === "excellent") {
      this.consecutivePoorPolls = 0;
      this.consecutiveBadPolls = 0;
      this.consecutiveBitrateStressPolls = 0;
    } else {
      return this.currentTier;
    }
    if (!inGrace) {
      const stressTier = this.resolveStressTier(stats, quality);
      if (stressTier) {
        return this.stepDownToward(this.currentTier, stressTier);
      }
    }
    if (quality !== "good" && quality !== "excellent") {
      return this.currentTier;
    }
    this.consecutiveGoodPolls += 1;
    if (this.consecutiveGoodPolls < UPGRADE_GOOD_POLLS_REQUIRED) {
      return this.currentTier;
    }
    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(this.currentTier);
    const maxTier = this.maxUpgradeTier(quality, stats);
    const maxIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(maxTier);
    if (currentIndex >= maxIndex) {
      return this.currentTier;
    }
    this.consecutiveGoodPolls = 0;
    return VIDEO_QUALITY_TIER_ORDER[currentIndex + 1];
  }
  resolveStressTier(stats, quality) {
    if (quality === "bad" && this.consecutiveBadPolls >= DOWNGRADE_POLLS_REQUIRED) {
      return "sd360";
    }
    if (quality === "poor" && this.consecutivePoorPolls >= DOWNGRADE_POLLS_REQUIRED) {
      return "sd480";
    }
    const bitrateDowngrade = this.bitrateConstrainedTier(stats);
    if (bitrateDowngrade) {
      this.consecutiveBitrateStressPolls += 1;
      if (this.consecutiveBitrateStressPolls >= DOWNGRADE_POLLS_REQUIRED) {
        return bitrateDowngrade;
      }
    } else {
      this.consecutiveBitrateStressPolls = 0;
    }
    return null;
  }
  /** Move down at most one tier per adaptation cycle toward the stress target. */
  stepDownToward(current, stress) {
    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(current);
    const stressIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(stress);
    if (currentIndex <= stressIndex) return current;
    return VIDEO_QUALITY_TIER_ORDER[currentIndex - 1];
  }
  maxUpgradeTier(quality, _stats) {
    if (quality === "good" || quality === "excellent") {
      return "hd1080";
    }
    return "hd720";
  }
  bitrateConstrainedTier(stats) {
    if (stats.availableOutgoingBitrate <= 0) return null;
    const currentProfile = getVideoQualityProfile(this.currentTier);
    const headroom = stats.availableOutgoingBitrate / (currentProfile.encodingParams.maxBitrate * BITRATE_HEADROOM_RATIO);
    if (headroom >= 1) return null;
    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(this.currentTier);
    if (currentIndex <= 0) return null;
    return VIDEO_QUALITY_TIER_ORDER[currentIndex - 1];
  }
};

// src/signaling/use-room-session.ts
function peerIsHost(role, userId, hostUserId) {
  if (role === "host") return true;
  return Boolean(hostUserId && userId === hostUserId);
}
function participantOptionsFromPeer(peer, hostUserId) {
  const userId = "user_id" in peer ? peer.user_id : void 0;
  const role = "role" in peer ? peer.role : void 0;
  return {
    isHost: peerIsHost(role, userId, hostUserId),
    role,
    permissions: "permissions" in peer ? peer.permissions : void 0,
    audioMuted: peer.is_audio_muted ?? false,
    videoOff: peer.is_video_muted ?? false,
    isScreenSharing: peer.is_screen_sharing ?? false,
    handRaised: peer.hand_raised ?? false
  };
}
function applyLocalMediaPermissions(permissions, setMicMuted, setVideoOff) {
  if (!permissions.microphone || !permissions.publish) {
    setMicMuted(true);
  }
  if (!permissions.camera || !permissions.publish) {
    setVideoOff(true);
  }
}
function buildParticipant(id, username, options = {}) {
  return {
    id,
    username,
    stream: null,
    isLocal: false,
    isHost: false,
    audioMuted: false,
    videoOff: false,
    isScreenSharing: false,
    connectionQuality: "unknown",
    handRaised: false,
    reaction: null,
    ...options
  };
}
var MAX_PENDING_OFFERS = 32;
var JOIN_RETRY_CODES = /* @__PURE__ */ new Set(["waiting_room_not_admitted", "room_unavailable"]);
var JOIN_RETRY_DELAY_MS = 800;
var RECEIVER_SYNC_DELAYS_MS = [0, 16, 32, 64, 128, 256, 512, 1e3];
var ROOM_SYNC_INTERVAL_MS = 250;
var ROOM_SYNC_MAX_DURATION_MS = 8e3;
var JOIN_TIMEOUT_MS = 15e3;
function resolveInboundVideoLabel(peer, stats) {
  const trackId = peer.stream?.getVideoTracks()[0]?.id;
  if (trackId && stats.inboundVideoResolutionsByTrackId[trackId]) {
    return stats.inboundVideoResolutionsByTrackId[trackId];
  }
  return stats.inboundVideoResolution || void 0;
}
function useRoomSession(roomId, enabled = true, hostUserId, options) {
  const displayName = sanitizeDisplayName(options?.displayName ?? "Guest");
  const lobbyUserId = options?.lobbyUserId;
  const isHost = options?.isHost ?? Boolean(hostUserId && options?.userId && options.userId === hostUserId);
  const mediaConstraints = options?.mediaConstraints;
  const initialMicMuted = options?.initialMicMuted ?? false;
  const initialVideoOff = options?.initialVideoOff ?? false;
  const joinWithoutMedia = options?.joinWithoutMedia ?? false;
  const [participants, setParticipants] = React2.useState([]);
  const [connected, setConnected] = React2.useState(false);
  const [connecting, setConnecting] = React2.useState(false);
  const [playing, setPlaying] = React2.useState(false);
  const [joinedAt, setJoinedAt] = React2.useState(null);
  const [error, setError] = React2.useState(null);
  const [notice, setNotice] = React2.useState(null);
  const [micMuted, setMicMuted] = React2.useState(initialMicMuted);
  const [videoOff, setVideoOff] = React2.useState(initialVideoOff);
  const [isScreenSharing, setIsScreenSharing] = React2.useState(false);
  const [handRaised, setHandRaised] = React2.useState(false);
  const [meetingMode, setMeetingMode] = React2.useState("interactive");
  const [sessionVer, setSessionVer] = React2.useState();
  const [publisherCount, setPublisherCount] = React2.useState(0);
  const [maxPublishers, setMaxPublishers] = React2.useState(0);
  const [isRecording, setIsRecording] = React2.useState(false);
  const [isRecordingPending, setIsRecordingPending] = React2.useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = React2.useState(null);
  const [meetingLocked, setMeetingLocked] = React2.useState(false);
  const [roomSettings, setRoomSettings] = React2.useState(
    () => options?.initialRoomSettings ?? {
      waiting_room_enabled: false,
      guest_can_chat: true,
      guest_can_react: true,
      guest_can_raise_hand: true,
      polls_enabled: true,
      qa_enabled: true,
      breakouts_enabled: true,
      is_recording_enabled: false
    }
  );
  const [polls, setPolls] = React2.useState([]);
  const [questions, setQuestions] = React2.useState([]);
  const [breakouts, setBreakouts] = React2.useState([]);
  const [breakoutId, setBreakoutId] = React2.useState(null);
  const [breakoutName, setBreakoutName] = React2.useState(null);
  const [projectFeatures, setProjectFeatures] = React2.useState(null);
  const [peerCaptions, setPeerCaptions] = React2.useState({});
  const [connectionQuality, setConnectionQuality] = React2.useState("unknown");
  const [videoQualityTier, setVideoQualityTier] = React2.useState(DEFAULT_VIDEO_QUALITY_TIER);
  const [videoQualityMode, setVideoQualityModeState] = React2.useState(() => readVideoQualityMode());
  const [signalingReady, setSignalingReady] = React2.useState(false);
  const signalingReadyRef = React2.useRef(false);
  React2.useEffect(() => {
    signalingReadyRef.current = signalingReady;
  }, [signalingReady]);
  const pcManagerRef = React2.useRef(null);
  const adaptiveVideoRef = React2.useRef(
    null
  );
  const localStreamRef = React2.useRef(null);
  const screenStreamRef = React2.useRef(null);
  const localPeerIdRef = React2.useRef(null);
  const pendingOffersRef = React2.useRef([]);
  const joinSentRef = React2.useRef(false);
  const reconnectModeRef = React2.useRef(false);
  const pendingReconnectRef = React2.useRef(false);
  const wasInSessionRef = React2.useRef(false);
  const signalingAcceptedRef = React2.useRef(false);
  const iceAllowedRef = React2.useRef(false);
  const streamIdToPeerIdRef = React2.useRef(/* @__PURE__ */ new Map());
  const pendingTracksRef = React2.useRef([]);
  const pendingJoinPeerIdsRef = React2.useRef([]);
  const peerReceiverWatchdogsRef = React2.useRef(/* @__PURE__ */ new Map());
  const roomReceiverWatchdogRef = React2.useRef(null);
  const roomSyncStartedAtRef = React2.useRef(null);
  const scheduleReceiverSyncRef = React2.useRef(() => {
  });
  const syncAllWaitingRemotesRef = React2.useRef(() => {
  });
  const renegotiatingRef = React2.useRef(false);
  const participantIdsRef = React2.useRef(/* @__PURE__ */ new Set());
  const participantsRef = React2.useRef([]);
  const sendRef = React2.useRef(
    () => {
    }
  );
  const joinRoomRef = React2.useRef(() => {
  });
  const joinRetryTimerRef = React2.useRef(null);
  const mediaReadyRef = React2.useRef(false);
  const signalingSocketOpenRef = React2.useRef(false);
  const recreatePeerConnectionRef = React2.useRef(() => {
  });
  const tryStartJoinRef = React2.useRef(() => {
  });
  const mediaConstraintsRef = React2.useRef(mediaConstraints);
  const micMutedRef = React2.useRef(initialMicMuted);
  const videoOffRef = React2.useRef(initialVideoOff);
  const isRecordingRef = React2.useRef(false);
  const isScreenSharingRef = React2.useRef(false);
  const recordingStartPendingRef = React2.useRef(false);
  const setRecordingPending = React2.useCallback((pending) => {
    recordingStartPendingRef.current = pending;
    setIsRecordingPending(pending);
  }, []);
  const closeRef = React2.useRef(() => {
  });
  const handleRemoteTrackRef = React2.useRef(() => {
  });
  const sessionSnapshotRef = React2.useRef({
    displayName,
    lobbyUserId,
    mediaConstraints,
    initialMicMuted,
    initialVideoOff,
    joinWithoutMedia,
    isHost,
    hostUserId: hostUserId ?? ""
  });
  const onStageReactionRef = React2.useRef(options?.onStageReaction);
  React2.useEffect(() => {
    onStageReactionRef.current = options?.onStageReaction;
  }, [options?.onStageReaction]);
  React2.useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);
  const emitStageReaction = React2.useCallback(
    (peerId, emoji, username) => {
      const resolvedUsername = username ?? participantsRef.current.find((peer) => peer.id === peerId)?.username ?? "Guest";
      onStageReactionRef.current?.({
        peerId,
        username: resolvedUsername,
        emoji,
        at: Date.now()
      });
    },
    []
  );
  React2.useEffect(() => {
    mediaConstraintsRef.current = mediaConstraints;
  }, [mediaConstraints]);
  React2.useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);
  React2.useEffect(() => {
    videoOffRef.current = videoOff;
  }, [videoOff]);
  React2.useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  React2.useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);
  const registerPeerId = React2.useCallback((peerId) => {
    participantIdsRef.current.add(peerId);
    streamIdToPeerIdRef.current.set(peerId, peerId);
  }, []);
  const bindStreamToPeer = React2.useCallback(
    (streamId, peerId) => {
      streamIdToPeerIdRef.current.set(streamId, peerId);
      if (streamId !== peerId) {
        streamIdToPeerIdRef.current.set(peerId, peerId);
      }
    },
    []
  );
  const resolvePeerIdForStream = React2.useCallback(
    (streamId, hintPeerId) => {
      if (hintPeerId) return hintPeerId;
      const mapped = streamIdToPeerIdRef.current.get(streamId);
      if (mapped) return mapped;
      if (participantIdsRef.current.has(streamId)) return streamId;
      const waitingRemotes = participantsRef.current.filter(
        (p) => !p.isLocal && !p.stream
      );
      const waitingIds = new Set(waitingRemotes.map((p) => p.id));
      for (const candidateId of pendingJoinPeerIdsRef.current) {
        if (waitingIds.has(candidateId)) return candidateId;
      }
      if (waitingRemotes.length === 1) return waitingRemotes[0].id;
      return void 0;
    },
    []
  );
  const resolveRemotePeerForOffer = React2.useCallback(
    (mediaPeerId) => {
      if (mediaPeerId && mediaPeerId !== localPeerIdRef.current && participantIdsRef.current.has(mediaPeerId)) {
        return mediaPeerId;
      }
      for (const candidateId of pendingJoinPeerIdsRef.current) {
        if (candidateId !== localPeerIdRef.current && participantIdsRef.current.has(candidateId)) {
          return candidateId;
        }
      }
      return null;
    },
    []
  );
  const scheduleRemoteTrackRemoval = React2.useCallback(
    (peerId, track) => {
      window.setTimeout(() => {
        if (renegotiatingRef.current) return;
        const pcm = pcManagerRef.current;
        const hasReplacement = pcm?.connection.getReceivers().some(
          (receiver) => receiver.track?.kind === track.kind && receiver.track.id !== track.id && receiver.track.readyState === "live"
        );
        if (hasReplacement) {
          signalingLog("remote track ended \u2014 replacement already active", {
            peerId,
            kind: track.kind
          });
          return;
        }
        setParticipants((current) => {
          const idx = current.findIndex((p) => p.id === peerId);
          if (idx === -1) return current;
          const peer = current[idx];
          if (!peer.stream) return current;
          const stillPresent = peer.stream.getTracks().some((t) => t.id === track.id && t.readyState === "live");
          if (stillPresent) return current;
          const nextStream = new MediaStream(
            peer.stream.getTracks().filter((t) => t.id !== track.id)
          );
          const next = [...current];
          next[idx] = {
            ...peer,
            stream: nextStream.getTracks().length > 0 ? nextStream : null,
            videoOff: track.kind === "video" ? !nextStream.getVideoTracks().some((t) => t.readyState === "live") : peer.videoOff
          };
          return next;
        });
      }, 750);
    },
    []
  );
  const reportError = React2.useCallback((input) => {
    if (renegotiatingRef.current) {
      signalingWarn("suppressed error during renegotiation", input);
      return;
    }
    let viewModel = typeof input === "string" ? resolveMeetingError({ message: input }) : input;
    const inSession = wasInSessionRef.current || connected || participantIdsRef.current.size > 0;
    if (!inSession && (viewModel.kind === "media" || viewModel.kind === "permission" || /camera|microphone|permission denied/i.test(
      `${viewModel.title} ${viewModel.description}`
    ))) {
      viewModel = {
        ...viewModel,
        kind: viewModel.kind === "unknown" ? "media" : viewModel.kind,
        blocking: true,
        recoverable: true
      };
    }
    if (!isMeetingErrorBlocking(viewModel, inSession)) {
      signalingWarn("meeting notice", viewModel);
      setNotice(viewModel);
      return;
    }
    signalingWarn(viewModel.title, viewModel);
    setConnecting(false);
    setConnected(false);
    setPlaying(false);
    setError(viewModel);
  }, [connected]);
  const clearError = React2.useCallback(() => {
    setError(null);
  }, []);
  const clearNotice = React2.useCallback(() => {
    setNotice(null);
  }, []);
  const clearJoinRetry = React2.useCallback(() => {
    if (joinRetryTimerRef.current) {
      window.clearTimeout(joinRetryTimerRef.current);
      joinRetryTimerRef.current = null;
    }
  }, []);
  const scheduleJoinRetry = React2.useCallback(
    (delayMs = JOIN_RETRY_DELAY_MS) => {
      clearJoinRetry();
      joinRetryTimerRef.current = window.setTimeout(() => {
        joinRetryTimerRef.current = null;
        if (signalingAcceptedRef.current) return;
        if (!signalingReadyRef.current) {
          scheduleJoinRetry(500);
          return;
        }
        joinSentRef.current = false;
        signalingLog("retrying join_room");
        joinRoomRef.current();
      }, delayMs);
    },
    [clearJoinRetry]
  );
  const retryJoin = React2.useCallback(() => {
    setError(null);
    setConnecting(true);
    joinSentRef.current = false;
    signalingAcceptedRef.current = false;
    iceAllowedRef.current = false;
    localPeerIdRef.current = null;
    pendingReconnectRef.current = false;
    joinRoomRef.current();
  }, []);
  const assignTrackToPeer = React2.useCallback(
    (peerId, track) => {
      setParticipants((current) => {
        const idx = current.findIndex((p) => p.id === peerId);
        if (idx === -1) {
          signalingWarn("assignTrackToPeer: peer not found", peerId);
          return current;
        }
        const peer = current[idx];
        const stream = mergeRemoteTrack(peer.stream, track);
        const hasVideo = stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled && !t.muted);
        const next = [...current];
        next[idx] = {
          ...peer,
          stream,
          videoOff: hasVideo ? false : peer.videoOff
        };
        return next;
      });
      setPlaying(true);
    },
    []
  );
  const attachRemoteTrackHandlers = React2.useCallback(
    (peerId, track) => {
      track.onended = () => {
        signalingLog("remote track ended", { peerId, kind: track.kind });
        scheduleRemoteTrackRemoval(peerId, track);
      };
      track.onunmute = () => {
        signalingLog("remote track unmuted", { peerId, kind: track.kind });
        assignTrackToPeer(peerId, track);
        scheduleReceiverSyncRef.current(peerId);
      };
    },
    [assignTrackToPeer, scheduleRemoteTrackRemoval]
  );
  const assignPendingTracksToPeer = React2.useCallback(
    (peerId) => {
      if (pendingTracksRef.current.length === 0) return;
      const pending = [...pendingTracksRef.current];
      const remaining = [];
      signalingLog("assigning pending tracks to peer", {
        peerId,
        count: pending.length
      });
      for (const entry of pending) {
        const mapped = entry.streamId ? streamIdToPeerIdRef.current.get(entry.streamId) : void 0;
        const resolved = mapped ?? resolvePeerIdForStream(entry.streamId);
        if (resolved !== peerId) {
          remaining.push(entry);
          continue;
        }
        if (entry.streamId) {
          bindStreamToPeer(entry.streamId, peerId);
        }
        attachRemoteTrackHandlers(peerId, entry.track);
        assignTrackToPeer(peerId, entry.track);
      }
      pendingTracksRef.current = remaining;
    },
    [assignTrackToPeer, attachRemoteTrackHandlers, bindStreamToPeer, resolvePeerIdForStream]
  );
  const flushPendingTracks = React2.useCallback(() => {
    const remaining = [];
    for (const entry of pendingTracksRef.current) {
      const peerId = entry.streamId ? resolvePeerIdForStream(entry.streamId) : resolvePeerIdForStream("");
      if (peerId) {
        if (peerId === localPeerIdRef.current) {
          remaining.push(entry);
          continue;
        }
        if (entry.streamId) bindStreamToPeer(entry.streamId, peerId);
        attachRemoteTrackHandlers(peerId, entry.track);
        assignTrackToPeer(peerId, entry.track);
      } else {
        remaining.push(entry);
      }
    }
    pendingTracksRef.current = remaining;
  }, [
    assignTrackToPeer,
    attachRemoteTrackHandlers,
    bindStreamToPeer,
    resolvePeerIdForStream
  ]);
  const clearPeerReceiverWatchdog = React2.useCallback((peerId) => {
    const timers = peerReceiverWatchdogsRef.current.get(peerId);
    if (!timers) return;
    for (const timer of timers) {
      window.clearTimeout(timer);
    }
    peerReceiverWatchdogsRef.current.delete(peerId);
  }, []);
  const clearAllReceiverWatchdogs = React2.useCallback(() => {
    for (const peerId of peerReceiverWatchdogsRef.current.keys()) {
      clearPeerReceiverWatchdog(peerId);
    }
    if (roomReceiverWatchdogRef.current != null) {
      window.clearInterval(roomReceiverWatchdogRef.current);
      roomReceiverWatchdogRef.current = null;
    }
    roomSyncStartedAtRef.current = null;
  }, [clearPeerReceiverWatchdog]);
  const peerNeedsVideoSync = React2.useCallback(
    (peer) => {
      if (peer.isLocal || peer.videoOff) return false;
      return !participantHasDisplayableVideo(peer);
    },
    []
  );
  const peerHasBoundVideo = React2.useCallback((peerId) => {
    const peer = participantsRef.current.find((item) => item.id === peerId);
    if (!peer || peer.isLocal || peer.videoOff) return true;
    return participantHasDisplayableVideo(peer);
  }, []);
  const syncRemoteReceivers = React2.useCallback(
    (peerId) => {
      const pcm = pcManagerRef.current;
      if (!pcm || peerId === localPeerIdRef.current) return;
      registerPeerId(peerId);
      const waitingRemotes = participantsRef.current.filter(
        (p) => !p.isLocal && !p.stream
      );
      const soleWaitingRemote = waitingRemotes.length === 1 ? waitingRemotes[0].id : null;
      for (const transceiver of pcm.connection.getTransceivers()) {
        const track = transceiver.receiver.track;
        if (!track || track.readyState === "ended") continue;
        const receiverStream = transceiver.receiver.streams?.[0];
        const streamId = receiverStream?.id ?? "";
        const mappedPeer = streamId ? streamIdToPeerIdRef.current.get(streamId) ?? (participantIdsRef.current.has(streamId) ? streamId : void 0) : void 0;
        const belongsToPeer = mappedPeer === peerId || streamId === peerId || !mappedPeer && soleWaitingRemote === peerId;
        if (!belongsToPeer) continue;
        const effectiveStreamId = streamId || peerId;
        bindStreamToPeer(effectiveStreamId, peerId);
        attachRemoteTrackHandlers(peerId, track);
        assignTrackToPeer(peerId, track);
      }
    },
    [
      assignTrackToPeer,
      attachRemoteTrackHandlers,
      bindStreamToPeer,
      registerPeerId
    ]
  );
  const runReceiverSyncForPeer = React2.useCallback(
    (peerId) => {
      if (peerId === localPeerIdRef.current) return;
      syncRemoteReceivers(peerId);
      assignPendingTracksToPeer(peerId);
      flushPendingTracks();
    },
    [assignPendingTracksToPeer, flushPendingTracks, syncRemoteReceivers]
  );
  const ensureRoomReceiverWatchdog = React2.useCallback(() => {
    if (roomReceiverWatchdogRef.current != null) return;
    roomSyncStartedAtRef.current = Date.now();
    roomReceiverWatchdogRef.current = window.setInterval(() => {
      const startedAt = roomSyncStartedAtRef.current;
      if (startedAt != null && Date.now() - startedAt > ROOM_SYNC_MAX_DURATION_MS) {
        if (roomReceiverWatchdogRef.current != null) {
          window.clearInterval(roomReceiverWatchdogRef.current);
          roomReceiverWatchdogRef.current = null;
        }
        roomSyncStartedAtRef.current = null;
        return;
      }
      const hasWaiting = participantsRef.current.some(peerNeedsVideoSync);
      if (!hasWaiting) {
        if (roomReceiverWatchdogRef.current != null) {
          window.clearInterval(roomReceiverWatchdogRef.current);
          roomReceiverWatchdogRef.current = null;
        }
        roomSyncStartedAtRef.current = null;
        return;
      }
      for (const peer of participantsRef.current) {
        if (!peerNeedsVideoSync(peer)) continue;
        runReceiverSyncForPeer(peer.id);
        if (!peerReceiverWatchdogsRef.current.has(peer.id)) {
          scheduleReceiverSyncRef.current(peer.id);
        }
      }
      flushPendingTracks();
    }, ROOM_SYNC_INTERVAL_MS);
  }, [flushPendingTracks, peerNeedsVideoSync, runReceiverSyncForPeer]);
  const syncAllWaitingRemotes = React2.useCallback(() => {
    for (const peer of participantsRef.current) {
      if (peer.isLocal || !peerNeedsVideoSync(peer)) continue;
      runReceiverSyncForPeer(peer.id);
      if (!peerReceiverWatchdogsRef.current.has(peer.id)) {
        scheduleReceiverSyncRef.current(peer.id);
      }
    }
    flushPendingTracks();
    ensureRoomReceiverWatchdog();
  }, [
    ensureRoomReceiverWatchdog,
    flushPendingTracks,
    peerNeedsVideoSync,
    runReceiverSyncForPeer
  ]);
  const scheduleReceiverSync = React2.useCallback(
    (peerId) => {
      if (peerId === localPeerIdRef.current) return;
      clearPeerReceiverWatchdog(peerId);
      const timers = [];
      for (const delay of RECEIVER_SYNC_DELAYS_MS) {
        const timer = window.setTimeout(() => {
          if (!participantIdsRef.current.has(peerId)) {
            clearPeerReceiverWatchdog(peerId);
            return;
          }
          runReceiverSyncForPeer(peerId);
          if (peerHasBoundVideo(peerId)) {
            clearPeerReceiverWatchdog(peerId);
          }
        }, delay);
        timers.push(timer);
      }
      peerReceiverWatchdogsRef.current.set(peerId, timers);
      runReceiverSyncForPeer(peerId);
      ensureRoomReceiverWatchdog();
    },
    [
      clearPeerReceiverWatchdog,
      ensureRoomReceiverWatchdog,
      peerHasBoundVideo,
      runReceiverSyncForPeer
    ]
  );
  React2.useEffect(() => {
    scheduleReceiverSyncRef.current = scheduleReceiverSync;
    syncAllWaitingRemotesRef.current = syncAllWaitingRemotes;
  }, [scheduleReceiverSync, syncAllWaitingRemotes]);
  const handleRemoteTrack = React2.useCallback(
    (track, streams) => {
      const stream = streams[0] ?? null;
      signalingLog("remote track received", {
        kind: track.kind,
        streamId: stream?.id ?? "none"
      });
      if (!stream) {
        pendingTracksRef.current.push({ track, streamId: "" });
        ensureRoomReceiverWatchdog();
        return;
      }
      const peerId = resolvePeerIdForStream(stream.id);
      if (peerId && peerId !== localPeerIdRef.current) {
        bindStreamToPeer(stream.id, peerId);
        attachRemoteTrackHandlers(peerId, track);
        assignTrackToPeer(peerId, track);
        scheduleReceiverSync(peerId);
        return;
      }
      pendingTracksRef.current.push({ track, streamId: stream.id });
      ensureRoomReceiverWatchdog();
    },
    [
      assignTrackToPeer,
      attachRemoteTrackHandlers,
      bindStreamToPeer,
      ensureRoomReceiverWatchdog,
      resolvePeerIdForStream,
      scheduleReceiverSync
    ]
  );
  const prebindRemotePeer = React2.useCallback((peerId) => {
    if (!peerId || peerId === localPeerIdRef.current) return;
    registerPeerId(peerId);
    bindStreamToPeer(peerId, peerId);
    scheduleReceiverSyncRef.current(peerId);
  }, [bindStreamToPeer, registerPeerId]);
  const processOffer = React2.useCallback(
    async (sdp, offerPeerId, mediaPeerId) => {
      const pcm = pcManagerRef.current;
      if (!pcm) {
        if (pendingOffersRef.current.length >= MAX_PENDING_OFFERS) {
          signalingWarn("offer queue full \u2014 dropping oldest offer");
          pendingOffersRef.current.shift();
        }
        pendingOffersRef.current.push({ sdp, peerId: offerPeerId });
        signalingLog("queued offer until peer connection is ready");
        return;
      }
      if (!sdp?.trim().startsWith("v=")) {
        signalingWarn("ignored offer with invalid SDP");
        return;
      }
      const remotePeerId = resolveRemotePeerForOffer(mediaPeerId);
      if (remotePeerId) {
        prebindRemotePeer(remotePeerId);
      }
      try {
        renegotiatingRef.current = true;
        iceAllowedRef.current = true;
        const answerSdp = await pcm.handleRemoteOffer(
          sdp,
          localStreamRef.current
        );
        if (answerSdp) {
          sendRef.current({ type: "answer", sdp: answerSdp });
        }
        if (remotePeerId) {
          scheduleReceiverSync(remotePeerId);
          assignPendingTracksToPeer(remotePeerId);
        }
        flushPendingTracks();
        if (remotePeerId && !peerHasBoundVideo(remotePeerId)) {
          scheduleReceiverSync(remotePeerId);
        }
        if (remotePeerId) {
          pendingJoinPeerIdsRef.current = pendingJoinPeerIdsRef.current.filter(
            (id) => id !== remotePeerId
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to negotiate WebRTC session";
        const pcmAlive = pcManagerRef.current;
        const sessionAlive = signalingAcceptedRef.current && pcmAlive && (pcmAlive.connectionState === "connected" || pcmAlive.connectionState === "connecting");
        if (sessionAlive) {
          signalingWarn("renegotiation failed \u2014 keeping existing session", message);
        } else {
          reportError(message);
        }
      } finally {
        window.setTimeout(() => {
          renegotiatingRef.current = false;
        }, 2e3);
      }
    },
    [
      assignPendingTracksToPeer,
      flushPendingTracks,
      peerHasBoundVideo,
      prebindRemotePeer,
      reportError,
      resolveRemotePeerForOffer,
      scheduleReceiverSync
    ]
  );
  const flushPendingOffers = React2.useCallback(async () => {
    const offers = [...pendingOffersRef.current];
    pendingOffersRef.current = [];
    for (const { sdp, peerId } of offers) {
      await processOffer(sdp, peerId);
    }
  }, [processOffer]);
  const ensureLocalStream = React2.useCallback(() => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = new MediaStream();
    localStreamRef.current = stream;
    return stream;
  }, []);
  const releaseLocalTrackKind = React2.useCallback(
    async (kind, options2) => {
      const pcm = pcManagerRef.current;
      const stream = localStreamRef.current;
      if (stream && pcm) {
        await mediaDeviceManager.releaseLocalTrack(
          pcm.connection,
          stream,
          kind,
          options2
        );
      }
      if (kind === "audio") {
        setMicMuted(true);
        micMutedRef.current = true;
      } else {
        setVideoOff(true);
        videoOffRef.current = true;
      }
      if (!stream) return;
      const nextStream = stream.getTracks().length > 0 ? stream : null;
      if (!nextStream) {
        localStreamRef.current = null;
      }
      setParticipants(
        (items) => items.map((peer) => {
          if (!peer.isLocal) return peer;
          return {
            ...peer,
            stream: nextStream,
            audioMuted: kind === "audio" ? true : peer.audioMuted,
            videoOff: kind === "video" ? true : peer.videoOff
          };
        })
      );
    },
    []
  );
  const handleMessage = React2.useCallback(
    async (message) => {
      switch (message.type) {
        case "room_joined": {
          clearJoinRetry();
          signalingAcceptedRef.current = true;
          wasInSessionRef.current = true;
          pendingReconnectRef.current = false;
          iceAllowedRef.current = true;
          localPeerIdRef.current = message.peer_id;
          registerPeerId(message.peer_id);
          for (const peer of message.peers) {
            registerPeerId(peer.peer_id);
          }
          setConnected(true);
          setConnecting(false);
          setPlaying(true);
          setJoinedAt(Date.now());
          if (message.meeting_mode) {
            setMeetingMode(message.meeting_mode);
          }
          if (message.session_ver != null) {
            setSessionVer(message.session_ver);
          }
          if (message.publisher_count != null) {
            setPublisherCount(message.publisher_count);
          }
          if (message.max_publishers != null) {
            setMaxPublishers(message.max_publishers);
          }
          if (message.is_recording) {
            setRecordingPending(false);
            setIsRecording(true);
            if (message.recording_started_at) {
              setRecordingStartedAt(message.recording_started_at);
            } else if (message.recording_id) {
              setRecordingStartedAt(Math.floor(Date.now() / 1e3));
            }
          } else {
            setRecordingPending(false);
            setIsRecording(false);
            setRecordingStartedAt(null);
          }
          if (message.polls) setPolls(message.polls);
          if (message.questions) setQuestions(message.questions);
          if (message.breakouts) setBreakouts(message.breakouts);
          setBreakoutId(message.breakout_id ?? null);
          setBreakoutName(message.breakout_name ?? null);
          if (message.room_settings) {
            setRoomSettings(message.room_settings);
          }
          if (message.project_features) {
            setProjectFeatures(message.project_features);
          }
          setParticipants([
            buildParticipant(message.peer_id, sessionSnapshotRef.current.displayName, {
              stream: localStreamRef.current,
              isLocal: true,
              isHost: sessionSnapshotRef.current.isHost,
              role: sessionSnapshotRef.current.isHost ? "host" : void 0,
              audioMuted: micMutedRef.current,
              videoOff: videoOffRef.current
            }),
            ...message.peers.filter((peer) => peer.peer_id !== message.peer_id).map(
              (peer) => buildParticipant(
                peer.peer_id,
                peer.username ?? peer.peer_id,
                participantOptionsFromPeer(
                  peer,
                  sessionSnapshotRef.current.hostUserId
                )
              )
            )
          ]);
          adaptiveVideoRef.current?.onSessionConnected();
          void flushPendingOffers().then(() => {
            flushPendingTracks();
            const pcmOnJoin = pcManagerRef.current;
            const videoTrackOnJoin = localStreamRef.current?.getVideoTracks().find((track) => track.readyState === "live") ?? null;
            if (pcmOnJoin && videoTrackOnJoin) {
              void pcmOnJoin.applyVideoQualityTier(
                DEFAULT_VIDEO_QUALITY_TIER,
                videoTrackOnJoin
              ).then((applied) => {
                if (!applied) return;
                setVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER);
                setParticipants(
                  (items) => items.map(
                    (peer) => peer.isLocal ? {
                      ...peer,
                      videoQualityLabel: getVideoQualityLabel(
                        DEFAULT_VIDEO_QUALITY_TIER
                      )
                    } : peer
                  )
                );
              });
            }
          });
          for (const peer of message.peers) {
            if (peer.peer_id === message.peer_id) continue;
            registerPeerId(peer.peer_id);
            scheduleReceiverSync(peer.peer_id);
          }
          break;
        }
        case "peer_joined":
          if (!pendingJoinPeerIdsRef.current.includes(message.peer_id)) {
            pendingJoinPeerIdsRef.current.push(message.peer_id);
          }
          registerPeerId(message.peer_id);
          setParticipants((current) => {
            if (current.some((peer) => peer.id === message.peer_id)) {
              return current;
            }
            const next = [
              ...current,
              buildParticipant(
                message.peer_id,
                message.username ?? message.peer_id,
                participantOptionsFromPeer(
                  message,
                  sessionSnapshotRef.current.hostUserId
                )
              )
            ];
            participantsRef.current = next;
            return next;
          });
          assignPendingTracksToPeer(message.peer_id);
          flushPendingTracks();
          scheduleReceiverSync(message.peer_id);
          break;
        case "peer_reconnecting":
          setParticipants(
            (current) => current.map(
              (peer) => peer.id === message.peer_id ? { ...peer, connectionQuality: "unknown" } : peer
            )
          );
          break;
        case "peer_reconnected": {
          registerPeerId(message.peer_id);
          participantIdsRef.current.delete(message.old_peer_id);
          participantIdsRef.current.add(message.peer_id);
          for (const [streamId, peerId] of streamIdToPeerIdRef.current) {
            if (peerId === message.old_peer_id) {
              streamIdToPeerIdRef.current.set(streamId, message.peer_id);
            }
          }
          pendingJoinPeerIdsRef.current = pendingJoinPeerIdsRef.current.map(
            (id) => id === message.old_peer_id ? message.peer_id : id
          );
          setParticipants(
            (current) => current.map(
              (peer) => peer.id === message.old_peer_id ? {
                ...peer,
                id: message.peer_id,
                username: message.username ?? peer.username,
                connectionQuality: "unknown"
              } : peer
            )
          );
          scheduleReceiverSync(message.peer_id);
          break;
        }
        case "peer_left":
          clearPeerReceiverWatchdog(message.peer_id);
          participantIdsRef.current.delete(message.peer_id);
          pendingJoinPeerIdsRef.current = pendingJoinPeerIdsRef.current.filter(
            (id) => id !== message.peer_id
          );
          setParticipants((current) => {
            const leaving = current.find(
              (peer) => peer.id === message.peer_id
            );
            if (leaving?.stream && !leaving.isLocal) {
              stopMediaStream(leaving.stream);
              for (const [sid, pid] of streamIdToPeerIdRef.current) {
                if (pid === message.peer_id)
                  streamIdToPeerIdRef.current.delete(sid);
              }
            }
            return current.filter((peer) => peer.id !== message.peer_id);
          });
          pendingTracksRef.current = pendingTracksRef.current.filter(
            (entry) => {
              const pid = streamIdToPeerIdRef.current.get(entry.streamId);
              return pid !== message.peer_id;
            }
          );
          break;
        case "offer":
          await processOffer(
            message.sdp,
            message.peer_id,
            message.media_peer_id
          );
          break;
        case "track_published":
          prebindRemotePeer(message.peer_id);
          break;
        case "ice_candidate": {
          const pcm = pcManagerRef.current;
          if (!pcm) return;
          try {
            await pcm.handleRemoteCandidate(message.candidate);
          } catch (err) {
            signalingWarn("failed to add remote ICE candidate", err);
          }
          break;
        }
        case "peer_muted":
          setParticipants(
            (current) => current.map((peer) => {
              if (peer.id !== message.peer_id) return peer;
              if (message.kind === "audio") {
                return { ...peer, audioMuted: message.muted };
              }
              return { ...peer, videoOff: message.muted };
            })
          );
          break;
        case "peer_screen_share":
          setParticipants(
            (current) => current.map(
              (peer) => peer.id === message.peer_id ? { ...peer, isScreenSharing: message.sharing } : peer
            )
          );
          break;
        case "peer_hand_raised":
          setParticipants(
            (current) => current.map(
              (peer) => peer.id === message.peer_id ? { ...peer, handRaised: message.raised } : peer
            )
          );
          break;
        case "peer_reaction":
          emitStageReaction(message.peer_id, message.emoji);
          break;
        case "permission_updated":
          setParticipants(
            (current) => current.map((peer) => {
              if (peer.id !== message.peer_id) return peer;
              const next = { ...peer, permissions: message.permissions };
              if (peer.isLocal) {
                const { permissions } = message;
                if (!permissions.publish) {
                  void releaseLocalTrackKind("audio");
                  void releaseLocalTrackKind("video", {
                    keepSender: isScreenSharingRef.current
                  });
                } else {
                  if (!permissions.microphone) {
                    void releaseLocalTrackKind("audio");
                  }
                  if (!permissions.camera) {
                    void releaseLocalTrackKind("video", {
                      keepSender: isScreenSharingRef.current
                    });
                  }
                }
                applyLocalMediaPermissions(
                  message.permissions,
                  setMicMuted,
                  setVideoOff
                );
              }
              return next;
            })
          );
          break;
        case "role_updated":
          setParticipants(
            (current) => current.map((peer) => {
              if (peer.id !== message.peer_id) return peer;
              return {
                ...peer,
                role: message.role,
                isHost: message.role === "host" || peer.isHost,
                permissions: message.permissions ?? peer.permissions
              };
            })
          );
          break;
        case "participant_removed":
          if (message.peer_id === localPeerIdRef.current) {
            closeRef.current();
            setError(
              resolveMeetingError({ message: "You were removed from the meeting" })
            );
            return;
          }
          participantIdsRef.current.delete(message.peer_id);
          setParticipants(
            (current) => current.filter((peer) => peer.id !== message.peer_id)
          );
          break;
        case "meeting_locked":
          setMeetingLocked(message.locked);
          break;
        case "room_settings_updated":
          setRoomSettings(message.settings);
          break;
        case "meeting_mode_changed":
          setMeetingMode(message.mode);
          setPublisherCount(message.publisher_count);
          setMaxPublishers(message.max_publishers);
          break;
        case "recording_started":
          setRecordingPending(false);
          setIsRecording(true);
          setRecordingStartedAt(message.started_at ?? Math.floor(Date.now() / 1e3));
          break;
        case "recording_stopped":
          setRecordingPending(false);
          setIsRecording(false);
          setRecordingStartedAt(null);
          break;
        case "peer_caption":
          setPeerCaptions((current) => ({
            ...current,
            [message.peer_id]: {
              peerId: message.peer_id,
              username: message.username ?? message.peer_id,
              text: message.text,
              final: message.final ?? false,
              updatedAt: Date.now()
            }
          }));
          break;
        case "poll_created":
          setPolls((current) => [message.poll, ...current.filter((p) => p.id !== message.poll.id)]);
          break;
        case "poll_updated":
          setPolls(
            (current) => current.map((poll) => poll.id === message.poll.id ? message.poll : poll)
          );
          break;
        case "poll_closed":
          setPolls((current) => current.filter((poll) => poll.id !== message.poll_id));
          break;
        case "question_posted":
          setQuestions((current) => [
            message.question,
            ...current.filter((q) => q.id !== message.question.id)
          ]);
          break;
        case "question_updated":
          setQuestions(
            (current) => current.map((q) => q.id === message.question.id ? message.question : q)
          );
          break;
        case "breakouts_created":
          setBreakouts(message.rooms);
          break;
        case "breakout_assigned":
          if (message.peer_id === localPeerIdRef.current) {
            setBreakoutId(message.room?.id || null);
            setBreakoutName(message.room?.name || null);
          }
          break;
        case "breakouts_closed":
          setBreakouts([]);
          setBreakoutId(null);
          setBreakoutName(null);
          break;
        case "room_ended":
          setConnected(false);
          setPlaying(false);
          setError(resolveMeetingError({ message: "Room ended" }));
          break;
        case "error":
          if (message.code === "republish_required") {
            signalingLog("republish required \u2014 resetting peer connection");
            reconnectModeRef.current = true;
            joinSentRef.current = false;
            signalingAcceptedRef.current = false;
            recreatePeerConnectionRef.current();
            tryStartJoinRef.current();
            break;
          }
          if (message.code === "recording_active") {
            setRecordingPending(false);
            setIsRecording(true);
            setRecordingStartedAt((current) => current ?? Math.floor(Date.now() / 1e3));
            break;
          }
          if (message.code === "recording_not_active") {
            setRecordingPending(false);
            setIsRecording(false);
            setRecordingStartedAt(null);
            break;
          }
          if (message.code === "governance_error" && isRecordingRef.current && /recording|finalize|ffmpeg|upload/i.test(message.message ?? "")) {
            setRecordingPending(false);
            setIsRecording(false);
            setRecordingStartedAt(null);
            signalingWarn("recording stop failed", signalingErrorViewModel(message));
            break;
          }
          if (message.code === "reconnect_failed" && pendingReconnectRef.current) {
            pendingReconnectRef.current = false;
            joinSentRef.current = false;
            recreatePeerConnectionRef.current();
            signalingLog("reconnect failed \u2014 falling back to join_room");
            joinRoomRef.current();
            break;
          }
          if (message.code && JOIN_RETRY_CODES.has(message.code)) {
            joinSentRef.current = false;
            setConnecting(false);
            setNotice(signalingErrorViewModel(message));
            scheduleJoinRetry();
            break;
          }
          reportError(signalingErrorViewModel(message));
          break;
        default:
          break;
      }
    },
    [
      assignPendingTracksToPeer,
      clearJoinRetry,
      clearPeerReceiverWatchdog,
      emitStageReaction,
      flushPendingOffers,
      flushPendingTracks,
      processOffer,
      prebindRemotePeer,
      registerPeerId,
      reportError,
      scheduleJoinRetry,
      scheduleReceiverSync,
      releaseLocalTrackKind,
      setRecordingPending
    ]
  );
  const joinRoom = React2.useCallback(() => {
    if (joinSentRef.current) return;
    if (!roomId.trim()) {
      reportError("Room id is required");
      return;
    }
    joinSentRef.current = true;
    const snap = sessionSnapshotRef.current;
    const roomPayload = {
      room_id: roomId.trim(),
      username: snap.displayName,
      ...snap.lobbyUserId ? { lobby_user_id: snap.lobbyUserId } : {}
    };
    if (reconnectModeRef.current) {
      reconnectModeRef.current = false;
      pendingReconnectRef.current = true;
      sendRef.current({ type: "reconnect_room", ...roomPayload });
      return;
    }
    sendRef.current({ type: "join_room", ...roomPayload });
  }, [reportError, roomId]);
  joinRoomRef.current = joinRoom;
  const tryStartJoin = React2.useCallback(() => {
    if (!signalingSocketOpenRef.current) return;
    if (!signalingReadyRef.current) return;
    if (!mediaReadyRef.current) return;
    joinRoomRef.current();
  }, []);
  tryStartJoinRef.current = tryStartJoin;
  const handleSocketOpen = React2.useCallback(() => {
    signalingSocketOpenRef.current = true;
    tryStartJoin();
  }, [tryStartJoin]);
  const handleSocketError = React2.useCallback(
    (message) => reportError(message),
    [reportError]
  );
  const handleSignalingReconnect = React2.useCallback(() => {
    if (wasInSessionRef.current) {
      reconnectModeRef.current = true;
      setConnecting(true);
      signalingLog("signaling reconnect after join \u2014 resetting peer connection");
      recreatePeerConnectionRef.current();
    }
    joinSentRef.current = false;
    signalingAcceptedRef.current = false;
    iceAllowedRef.current = true;
    localPeerIdRef.current = null;
    pendingOffersRef.current = [];
    renegotiatingRef.current = false;
  }, []);
  const { send, close } = useSignalingSocket(
    enabled && Boolean(roomId),
    handleMessage,
    handleSocketOpen,
    {
      onError: handleSocketError,
      onReconnect: handleSignalingReconnect,
      autoReconnect: true,
      token: options?.token,
      wsUrl: options?.wsUrl
    }
  );
  sendRef.current = send;
  closeRef.current = close;
  React2.useEffect(() => {
    handleRemoteTrackRef.current = handleRemoteTrack;
  }, [handleRemoteTrack]);
  React2.useEffect(() => {
    if (signalingReady) {
      tryStartJoin();
    }
  }, [signalingReady, tryStartJoin]);
  React2.useEffect(() => {
    if (!connected) return;
    flushPendingTracks();
    syncAllWaitingRemotes();
  }, [connected, participants, flushPendingTracks, syncAllWaitingRemotes]);
  React2.useEffect(() => {
    if (!enabled || !roomId) return;
    sessionSnapshotRef.current = {
      displayName,
      lobbyUserId,
      mediaConstraints,
      initialMicMuted,
      initialVideoOff,
      joinWithoutMedia,
      isHost,
      hostUserId: hostUserId ?? ""
    };
    let cancelled = false;
    joinSentRef.current = false;
    signalingAcceptedRef.current = false;
    iceAllowedRef.current = false;
    localPeerIdRef.current = null;
    mediaReadyRef.current = false;
    signalingSocketOpenRef.current = false;
    roomSyncStartedAtRef.current = null;
    pendingOffersRef.current = [];
    streamIdToPeerIdRef.current = /* @__PURE__ */ new Map();
    participantIdsRef.current = /* @__PURE__ */ new Set();
    pendingTracksRef.current = [];
    pendingJoinPeerIdsRef.current = [];
    setSignalingReady(false);
    setPlaying(false);
    const snap = sessionSnapshotRef.current;
    function createPeerConnectionManager() {
      return new PeerConnectionManager(
        {
          onIceCandidate: (candidate) => {
            if (!iceAllowedRef.current) return;
            sendRef.current({
              type: "ice_candidate",
              candidate: serializeIceCandidate(candidate)
            });
          },
          onTrack: (track, streams) => {
            handleRemoteTrackRef.current(track, streams);
          },
          onConnectionStateChange: (state) => {
            if (state === "connected") {
              setPlaying(true);
              renegotiatingRef.current = false;
              syncAllWaitingRemotesRef.current();
            }
            if (state === "failed") {
              if (renegotiatingRef.current) {
                signalingWarn(
                  "connection failed during renegotiation \u2014 monitoring recovery"
                );
                return;
              }
              window.setTimeout(() => {
                const pcmAlive = pcManagerRef.current;
                if (!pcmAlive) return;
                if (renegotiatingRef.current) return;
                const current = pcmAlive.connectionState;
                if (current === "connected" || current === "connecting") return;
                reportError("WebRTC connection failed");
              }, 3e3);
            }
          },
          onIceFailure: () => {
            signalingWarn("ICE connection failed \u2014 attempting restart");
          },
          onIceConnectionStateChange: (state) => {
            if (state === "connected" || state === "completed") {
              syncAllWaitingRemotesRef.current();
            }
          },
          onNegotiationComplete: () => {
            syncAllWaitingRemotesRef.current();
          },
          onBeforeCreateAnswer: async (pc, isRenegotiation) => {
            if (sessionSnapshotRef.current.isHost && !isRenegotiation) {
              try {
                await mediaDeviceManager.ensureStageRecordingTransceiver(pc);
              } catch (err) {
                signalingWarn("stage recording transceiver setup failed", err);
              }
            }
          },
          onStatsUpdate: (stats, quality) => {
            if (!renegotiatingRef.current) {
              setConnectionQuality(quality);
              setParticipants(
                (items) => items.map((peer) => {
                  if (peer.isLocal) {
                    return { ...peer, connectionQuality: quality };
                  }
                  const inboundVideoLabel = resolveInboundVideoLabel(peer, stats);
                  return inboundVideoLabel ? { ...peer, inboundVideoLabel } : peer;
                })
              );
              const adaptive = adaptiveVideoRef.current;
              const pcmAlive = pcManagerRef.current;
              if (adaptive && pcmAlive) {
                const iceState = pcmAlive.iceConnectionState;
                const mediaReady = signalingAcceptedRef.current && (iceState === "connected" || iceState === "completed");
                const videoTrack = localStreamRef.current?.getVideoTracks().find((track) => track.readyState === "live") ?? null;
                adaptive.evaluate(stats, quality, pcmAlive, {
                  skip: isScreenSharingRef.current || !mediaReady,
                  videoTrack
                });
              }
            }
            if (quality === "bad" && !renegotiatingRef.current && stats.roundTripTime > 0 && stats.roundTripTime < 3e3) {
              signalingWarn("connection quality degraded", {
                quality,
                rttMs: Math.round(stats.roundTripTime),
                lossDelta: stats.lossDelta,
                cumulativeLoss: stats.audioPacketsLost + stats.videoPacketsLost,
                jitter: stats.audioJitter,
                fps: stats.videoFrameRate
              });
            }
          }
        },
        void 0,
        ROOM_PEER_CONNECTION_OPTIONS
      );
    }
    async function startSession() {
      setConnecting(true);
      setError(null);
      try {
        adaptiveVideoRef.current = new AdaptiveVideoQualityController(
          (tier) => {
            setVideoQualityTier(tier);
            setParticipants(
              (items) => items.map(
                (peer) => peer.isLocal ? { ...peer, videoQualityLabel: getVideoQualityLabel(tier) } : peer
              )
            );
          },
          readVideoQualityMode()
        );
        const pcm = createPeerConnectionManager();
        pcManagerRef.current = pcm;
        pcm.startStatsPolling();
        recreatePeerConnectionRef.current = () => {
          const current = pcManagerRef.current;
          if (current) {
            current.stopStatsPolling();
            current.close();
          }
          const next = createPeerConnectionManager();
          pcManagerRef.current = next;
          next.startStatsPolling();
          iceAllowedRef.current = true;
          pendingOffersRef.current = [];
          renegotiatingRef.current = false;
          const stream = localStreamRef.current;
          if (stream) {
            next.attachLocalTracks(stream);
          }
        };
        iceAllowedRef.current = true;
        if (cancelled) return;
        setSignalingReady(true);
        if (snap.joinWithoutMedia) {
          localStreamRef.current = null;
          setMicMuted(true);
          setVideoOff(true);
          micMutedRef.current = true;
          videoOffRef.current = true;
          setParticipants([
            buildParticipant("local-preview", snap.displayName, {
              stream: null,
              isLocal: true,
              isHost: snap.isHost,
              audioMuted: true,
              videoOff: true
            })
          ]);
          mediaReadyRef.current = true;
          tryStartJoin();
          return;
        }
        setParticipants([
          buildParticipant("local-preview", snap.displayName, {
            stream: null,
            isLocal: true,
            isHost: snap.isHost,
            audioMuted: snap.initialMicMuted,
            videoOff: snap.initialVideoOff
          })
        ]);
        const localStream = await mediaDeviceManager.getUserMedia(
          snap.mediaConstraints
        );
        if (cancelled) {
          stopMediaStream(localStream);
          return;
        }
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !snap.initialMicMuted;
        });
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !snap.initialVideoOff;
        });
        localStreamRef.current = localStream;
        setMicMuted(snap.initialMicMuted);
        setVideoOff(snap.initialVideoOff);
        micMutedRef.current = snap.initialMicMuted;
        videoOffRef.current = snap.initialVideoOff;
        setParticipants([
          buildParticipant("local-preview", snap.displayName, {
            stream: localStream,
            isLocal: true,
            isHost: snap.isHost,
            audioMuted: snap.initialMicMuted,
            videoOff: snap.initialVideoOff,
            videoQualityLabel: getVideoQualityLabel(DEFAULT_VIDEO_QUALITY_TIER)
          })
        ]);
        mediaReadyRef.current = true;
        tryStartJoin();
      } catch (err) {
        if (!cancelled) {
          reportError(
            err instanceof Error ? err.message : "Unable to access camera/mic"
          );
        }
      }
    }
    startSession();
    const timeout = window.setTimeout(() => {
      if (!signalingAcceptedRef.current && !cancelled) {
        reportError("Timed out waiting to join the room");
      }
    }, JOIN_TIMEOUT_MS);
    return () => {
      cancelled = true;
      mediaReadyRef.current = false;
      signalingSocketOpenRef.current = false;
      clearJoinRetry();
      window.clearTimeout(timeout);
      releaseLocalMediaRef.current(true);
      setSignalingReady(false);
    };
  }, [enabled, roomId, tryStartJoin]);
  const acquireLocalTrack = React2.useCallback(
    async (kind) => {
      const pcm = pcManagerRef.current;
      if (!pcm) {
        throw new Error("Not connected to the meeting");
      }
      const stream = ensureLocalStream();
      const existing = stream.getTracks().find((track2) => track2.kind === kind && track2.readyState === "live");
      if (existing) return existing;
      const constraints = kind === "audio" ? buildAudioOnlyConstraints(mediaConstraintsRef.current) : buildVideoOnlyConstraints(mediaConstraintsRef.current);
      const acquired = await mediaDeviceManager.getUserMedia(constraints);
      const track = acquired.getTracks().find((item) => item.kind === kind);
      if (!track) {
        stopMediaStream(acquired);
        throw new Error(
          kind === "audio" ? "Unable to access microphone" : "Unable to access camera"
        );
      }
      acquired.getTracks().forEach((item) => {
        if (item !== track) item.stop();
      });
      stream.addTrack(track);
      await mediaDeviceManager.addOrReplaceTrack(pcm.connection, stream, track);
      if (kind === "video") {
        void pcm.applyVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER, track);
      }
      setParticipants(
        (items) => items.map((peer) => peer.isLocal ? { ...peer, stream } : peer)
      );
      return track;
    },
    [ensureLocalStream]
  );
  const releaseLocalMedia = React2.useCallback(
    (sendLeave = true) => {
      if (sendLeave && (joinSentRef.current || signalingAcceptedRef.current)) {
        sendRef.current({ type: "leave_room" });
      }
      pcManagerRef.current?.stopStatsPolling();
      const pc = pcManagerRef.current?.connection;
      if (pc) {
        for (const sender of pc.getSenders()) {
          sender.track?.stop();
          void sender.replaceTrack(null).catch(() => void 0);
        }
      }
      pcManagerRef.current?.close();
      pcManagerRef.current = null;
      clearAllReceiverWatchdogs();
      adaptiveVideoRef.current?.reset();
      adaptiveVideoRef.current = null;
      setVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER);
      stopMediaStream(screenStreamRef.current);
      screenStreamRef.current = null;
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
      closeRef.current();
      joinSentRef.current = false;
      signalingAcceptedRef.current = false;
      iceAllowedRef.current = false;
      localPeerIdRef.current = null;
      pendingOffersRef.current = [];
      pendingTracksRef.current = [];
      streamIdToPeerIdRef.current = /* @__PURE__ */ new Map();
      participantIdsRef.current = /* @__PURE__ */ new Set();
      pendingJoinPeerIdsRef.current = [];
      setConnected(false);
      setPlaying(false);
      setSignalingReady(false);
      setJoinedAt(null);
    },
    [clearAllReceiverWatchdogs]
  );
  const releaseLocalMediaRef = React2.useRef(releaseLocalMedia);
  releaseLocalMediaRef.current = releaseLocalMedia;
  const toggleMic = React2.useCallback(async () => {
    const pcm = pcManagerRef.current;
    if (!pcm) return;
    if (micMuted) {
      try {
        const track = await acquireLocalTrack("audio");
        track.enabled = true;
        sendRef.current({ type: "unmute_audio" });
        setMicMuted(false);
        micMutedRef.current = false;
        setParticipants(
          (items) => items.map(
            (peer) => peer.isLocal ? { ...peer, audioMuted: false } : peer
          )
        );
      } catch (err) {
        signalingWarn("failed to enable microphone", err);
        reportError(
          err instanceof Error ? err.message : "Unable to turn on microphone"
        );
      }
      return;
    }
    await releaseLocalTrackKind("audio");
    sendRef.current({ type: "mute_audio" });
  }, [acquireLocalTrack, micMuted, releaseLocalTrackKind, reportError]);
  const toggleVideo = React2.useCallback(async () => {
    const pcm = pcManagerRef.current;
    if (!pcm) return;
    if (videoOff) {
      try {
        const stream = ensureLocalStream();
        let videoTrack = stream.getVideoTracks().find((track) => track.readyState === "live");
        if (!videoTrack) {
          videoTrack = await acquireLocalTrack("video");
        } else {
          videoTrack.enabled = true;
          await mediaDeviceManager.addOrReplaceTrack(
            pcm.connection,
            stream,
            videoTrack
          );
          void pcm.applyVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER, videoTrack);
        }
        sendRef.current({ type: "unmute_video" });
        setVideoOff(false);
        videoOffRef.current = false;
        setParticipants(
          (items) => items.map(
            (peer) => peer.isLocal ? { ...peer, stream, videoOff: false } : peer
          )
        );
      } catch (err) {
        signalingWarn("failed to enable camera", err);
        reportError(
          err instanceof Error ? err.message : "Unable to turn on camera"
        );
      }
      return;
    }
    await releaseLocalTrackKind("video", {
      keepSender: isScreenSharingRef.current
    });
    sendRef.current({ type: "mute_video" });
  }, [acquireLocalTrack, ensureLocalStream, releaseLocalTrackKind, reportError, videoOff]);
  const toggleScreenShare = React2.useCallback(async () => {
    const pcm = pcManagerRef.current;
    if (!pcm) return;
    if (isScreenSharing) {
      stopMediaStream(screenStreamRef.current);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      sendRef.current({ type: "screen_share_stop" });
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        await mediaDeviceManager.replaceTrack(pcm.connection, cameraTrack);
        const tier = adaptiveVideoRef.current?.tier ?? pcm.videoQualityTier ?? DEFAULT_VIDEO_QUALITY_TIER;
        await pcm.applyVideoQualityTier(tier, cameraTrack);
      }
      setParticipants(
        (items) => items.map(
          (peer) => peer.isLocal ? { ...peer, isScreenSharing: false } : peer
        )
      );
      return;
    }
    try {
      const screenStream = await mediaDeviceManager.getDisplayMedia();
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      sendRef.current({ type: "screen_share_start" });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        await mediaDeviceManager.replaceTrack(pcm.connection, screenTrack);
        await pcm.configureScreenShareSender(screenTrack);
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          sendRef.current({ type: "screen_share_stop" });
          const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
          if (cameraTrack && pcManagerRef.current) {
            void mediaDeviceManager.replaceTrack(pcManagerRef.current.connection, cameraTrack).then(async () => {
              const tier = adaptiveVideoRef.current?.tier ?? pcManagerRef.current?.videoQualityTier ?? DEFAULT_VIDEO_QUALITY_TIER;
              await pcManagerRef.current?.applyVideoQualityTier(tier, cameraTrack);
            });
          }
          setParticipants(
            (items) => items.map(
              (peer) => peer.isLocal ? { ...peer, isScreenSharing: false } : peer
            )
          );
        };
      }
      setParticipants(
        (items) => items.map(
          (peer) => peer.isLocal ? { ...peer, isScreenSharing: true } : peer
        )
      );
    } catch {
    }
  }, [isScreenSharing]);
  const toggleRaiseHand = React2.useCallback(() => {
    setHandRaised((current) => {
      const next = !current;
      sendRef.current({ type: next ? "raise_hand" : "lower_hand" });
      setParticipants(
        (items) => items.map(
          (peer) => peer.isLocal ? { ...peer, handRaised: next } : peer
        )
      );
      return next;
    });
  }, []);
  const sendReaction = React2.useCallback((emoji) => {
    sendRef.current({ type: "reaction", emoji });
    const peerId = localPeerIdRef.current;
    if (peerId) {
      emitStageReaction(
        peerId,
        emoji,
        sessionSnapshotRef.current.displayName
      );
    }
  }, [emitStageReaction]);
  const sendCaption = React2.useCallback((text, final = false) => {
    sendRef.current({ type: "caption_update", text, final });
  }, []);
  const createPoll = React2.useCallback((question, options2) => {
    sendRef.current({ type: "create_poll", question, options: options2 });
  }, []);
  const votePoll = React2.useCallback((pollId, optionId) => {
    sendRef.current({ type: "vote_poll", poll_id: pollId, option_id: optionId });
  }, []);
  const closePoll = React2.useCallback((pollId) => {
    sendRef.current({ type: "close_poll", poll_id: pollId });
  }, []);
  const askQuestion = React2.useCallback((content) => {
    sendRef.current({ type: "ask_question", content });
  }, []);
  const upvoteQuestion = React2.useCallback((questionId) => {
    sendRef.current({ type: "upvote_question", question_id: questionId });
  }, []);
  const answerQuestion = React2.useCallback((questionId) => {
    sendRef.current({ type: "answer_question", question_id: questionId });
  }, []);
  const dismissQuestion = React2.useCallback((questionId) => {
    sendRef.current({ type: "dismiss_question", question_id: questionId });
  }, []);
  const createBreakouts = React2.useCallback((count, names) => {
    sendRef.current({ type: "create_breakouts", count, names });
  }, []);
  const joinBreakout = React2.useCallback((breakoutId2) => {
    sendRef.current({ type: "join_breakout", breakout_id: breakoutId2 });
  }, []);
  const returnToMain = React2.useCallback(() => {
    sendRef.current({ type: "return_to_main" });
    setBreakoutId(null);
    setBreakoutName(null);
  }, []);
  const closeBreakouts = React2.useCallback(() => {
    sendRef.current({ type: "close_breakouts" });
  }, []);
  const leave = React2.useCallback(() => {
    releaseLocalMedia(true);
  }, [releaseLocalMedia]);
  const sendHostControl = React2.useCallback((message) => {
    sendRef.current(message);
  }, []);
  const updateRoomSettings = React2.useCallback((patch) => {
    if (Object.keys(patch).length === 0) return;
    sendHostControl({ type: "update_room_settings", patch });
    setRoomSettings((current) => ({ ...current, ...patch }));
  }, [sendHostControl]);
  const hostControls = React2.useMemo(
    () => ({
      muteParticipant: (peerId) => sendHostControl({ type: "mute_participant", peer_id: peerId }),
      removeParticipant: (peerId) => sendHostControl({ type: "remove_participant", peer_id: peerId }),
      approveHand: (peerId) => sendHostControl({ type: "approve_hand", peer_id: peerId }),
      revokePermission: (peerId) => sendHostControl({ type: "revoke_permission", peer_id: peerId }),
      grantSpeakPermission: (peerId) => sendHostControl({
        type: "grant_permission",
        peer_id: peerId,
        permissions: {
          microphone: true,
          camera: false,
          screen_share: false,
          publish: true
        }
      }),
      promoteModerator: (peerId) => sendHostControl({ type: "promote_moderator", peer_id: peerId }),
      muteAll: () => sendHostControl({ type: "mute_all" }),
      disableAllCameras: () => sendHostControl({ type: "disable_all_cameras" }),
      lockMeeting: () => sendHostControl({ type: "lock_meeting" }),
      unlockMeeting: () => sendHostControl({ type: "unlock_meeting" }),
      prepareStageRecording: async (stream) => {
        const pcm = pcManagerRef.current;
        if (!pcm) {
          throw new Error("Not connected to the meeting");
        }
        await mediaDeviceManager.publishStageRecordingTrack(
          pcm.connection,
          stream
        );
      },
      stopStageRecording: async () => {
        const pcm = pcManagerRef.current;
        if (!pcm) return;
        await mediaDeviceManager.unpublishStageRecordingTrack(pcm.connection);
      },
      sendStartRecording: () => {
        if (isRecordingRef.current || recordingStartPendingRef.current) return;
        setRecordingPending(true);
        sendHostControl({ type: "start_recording" });
      },
      startRecording: () => {
        if (isRecordingRef.current || recordingStartPendingRef.current) return;
        setRecordingPending(true);
        sendHostControl({ type: "start_recording" });
      },
      stopRecording: () => {
        if (!isRecordingRef.current) return;
        sendHostControl({ type: "stop_recording" });
      },
      endMeeting: () => sendHostControl({ type: "end_meeting" })
    }),
    [sendHostControl, setRecordingPending]
  );
  const localParticipant = participants.find((peer) => peer.isLocal);
  const canManage = localParticipant?.role === "host" || localParticipant?.role === "moderator" || localParticipant?.isHost === true;
  const isHostRole = localParticipant?.role === "host";
  const isListener = meetingMode === "large" && localParticipant?.permissions?.publish !== true;
  const setVideoQualityMode = React2.useCallback((mode) => {
    writeVideoQualityMode(mode);
    setVideoQualityModeState(mode);
    adaptiveVideoRef.current?.setMode(mode);
    const pcm = pcManagerRef.current;
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!pcm || !cameraTrack || isScreenSharingRef.current) return;
    if (mode === "max") {
      void pcm.applyVideoQualityTier("hd1080", cameraTrack);
    }
  }, []);
  const raisedHands = participants.filter(
    (peer) => peer.handRaised && !peer.isLocal
  );
  return {
    participants,
    connected,
    connecting,
    playing,
    joinedAt,
    error,
    notice,
    micMuted,
    videoOff,
    isScreenSharing,
    handRaised,
    meetingMode,
    sessionVer,
    publisherCount,
    maxPublishers,
    isListener,
    isRecording,
    isRecordingPending,
    recordingStartedAt,
    meetingLocked,
    roomSettings,
    projectFeatures,
    canManage,
    isHostRole,
    raisedHands,
    hostControls,
    updateRoomSettings,
    connectionQuality,
    videoQualityTier,
    videoQualityMode,
    setVideoQualityMode,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    toggleRaiseHand,
    sendReaction,
    sendCaption,
    polls,
    questions,
    breakouts,
    breakoutId,
    breakoutName,
    peerCaptions,
    createPoll,
    votePoll,
    closePoll,
    askQuestion,
    upvoteQuestion,
    answerQuestion,
    dismissQuestion,
    createBreakouts,
    joinBreakout,
    returnToMain,
    closeBreakouts,
    clearError,
    clearNotice,
    retryJoin,
    leave
  };
}

export {
  readVideoQualityMode,
  writeVideoQualityMode,
  VIDEO_QUALITY_MODE_OPTIONS,
  useSignalingSocket,
  useRoomSession
};
//# sourceMappingURL=chunk-3POXSNJG.js.map