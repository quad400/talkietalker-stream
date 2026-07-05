import {
  useBroadcastViewer
} from "../chunk-FBZQ4VAI.js";
import {
  VIDEO_QUALITY_MODE_OPTIONS,
  readVideoQualityMode,
  useRoomSession,
  useSignalingSocket,
  writeVideoQualityMode
} from "../chunk-YUHR4S2U.js";
import "../chunk-LQG3EZ37.js";
import "../chunk-J3H4LAQR.js";
import {
  DEFAULT_ROOM_SETTINGS,
  buildAudioOnlyConstraints,
  buildMediaLessConstraints,
  buildPrejoinMediaConstraints,
  buildVideoOnlyConstraints,
  getOrCreateLobbyUserId,
  getStoredDisplayName,
  getStoredGuestId,
  getStoredGuestToken,
  resolveRoomDisplayName,
  setStoredDisplayName,
  setStoredGuestSession
} from "../chunk-U7MD5TET.js";
import {
  DEFAULT_ICE_SERVERS,
  DEFAULT_RTC_CONFIG,
  SIMULCAST_LAYERS
} from "../chunk-GWIKW3Y4.js";
import {
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
  DEFAULT_VIDEO_QUALITY_MODE,
  DEFAULT_VIDEO_QUALITY_TIER,
  SCREEN_SHARE_ENCODING,
  VIDEO_QUALITY_PROFILES,
  VIDEO_QUALITY_TIER_ORDER,
  analyzeSdp,
  buildSignalingWsUrl,
  getVideoQualityLabel,
  getVideoQualityProfile,
  isCameraVideoTrack,
  isMeetingErrorBlocking,
  isScreenShareVideoTrack,
  isValidIceCandidateInit,
  logSdpAnalysis,
  mergeRemoteTrack,
  normalizeSdp,
  normalizeSdpText,
  parseIceCandidateInit,
  parseSignalingMessage,
  participantHasDisplayableVideo,
  repairSdpForNegotiation,
  resolveAccessToken,
  resolveMeetingError,
  sanitizeDisplayName,
  sanitizeSdpSafe,
  serializeIceCandidate,
  signalingErrorMessage,
  signalingErrorViewModel,
  signalingLog,
  signalingWarn,
  stopMediaStream,
  validateRoomModeSdp,
  wireLobbyOutgoing,
  wireOutgoing
} from "../chunk-6JT6IE2I.js";

// src/signaling/use-closed-captions.ts
import * as React from "react";
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const w = window;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function useCaptionPublisher(enabled, onCaption) {
  const [supported, setSupported] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const onCaptionRef = React.useRef(onCaption);
  React.useEffect(() => {
    onCaptionRef.current = onCaption;
  }, [onCaption]);
  React.useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);
  React.useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!enabled || !Recognition) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let text = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i]?.[0]?.transcript ?? "";
        if (event.results[i]?.isFinal) {
          isFinal = true;
        }
      }
      const trimmed = text.trim();
      if (trimmed) {
        onCaptionRef.current(trimmed, isFinal);
      }
    };
    recognition.onerror = () => {
    };
    recognition.onend = () => {
      if (enabled && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setSupported(false);
    }
    return () => {
      recognitionRef.current = null;
      recognition.stop();
    };
  }, [enabled]);
  return { supported };
}
export {
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
  DEFAULT_ICE_SERVERS,
  DEFAULT_ROOM_SETTINGS,
  DEFAULT_RTC_CONFIG,
  DEFAULT_VIDEO_QUALITY_MODE,
  DEFAULT_VIDEO_QUALITY_TIER,
  SCREEN_SHARE_ENCODING,
  SIMULCAST_LAYERS,
  VIDEO_QUALITY_MODE_OPTIONS,
  VIDEO_QUALITY_PROFILES,
  VIDEO_QUALITY_TIER_ORDER,
  analyzeSdp,
  buildAudioOnlyConstraints,
  buildMediaLessConstraints,
  buildPrejoinMediaConstraints,
  buildSignalingWsUrl,
  buildVideoOnlyConstraints,
  getOrCreateLobbyUserId,
  getStoredDisplayName,
  getStoredGuestId,
  getStoredGuestToken,
  getVideoQualityLabel,
  getVideoQualityProfile,
  isCameraVideoTrack,
  isMeetingErrorBlocking,
  isScreenShareVideoTrack,
  isValidIceCandidateInit,
  logSdpAnalysis,
  mergeRemoteTrack,
  normalizeSdp,
  normalizeSdpText,
  parseIceCandidateInit,
  parseSignalingMessage,
  participantHasDisplayableVideo,
  readVideoQualityMode,
  repairSdpForNegotiation,
  resolveAccessToken,
  resolveMeetingError,
  resolveRoomDisplayName,
  sanitizeDisplayName,
  sanitizeSdpSafe,
  serializeIceCandidate,
  setStoredDisplayName,
  setStoredGuestSession,
  signalingErrorMessage,
  signalingErrorViewModel,
  signalingLog,
  signalingWarn,
  stopMediaStream,
  useBroadcastViewer,
  useCaptionPublisher,
  useRoomSession,
  useSignalingSocket,
  validateRoomModeSdp,
  wireLobbyOutgoing,
  wireOutgoing,
  writeVideoQualityMode
};
//# sourceMappingURL=index.js.map