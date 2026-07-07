import { j as SignalingIncomingMessage, k as SignalingOutgoingMessage, C as ConnectionQuality } from '../types-B0jEi-Tw.js';
export { B as BreakoutRoom, D as DEFAULT_ICE_SERVERS, a as DEFAULT_RTC_CONFIG, M as MeetingMode, b as MeetingPoll, c as MeetingPollOption, d as MeetingQuestion, e as MeetingRole, P as ParsedStats, f as PermissionSet, g as ProjectFeaturesPayload, R as RoomSessionOptions, h as RoomSettings, i as RoomSettingsPatch, S as SIMULCAST_LAYERS, l as SignalingParticipant, m as SignalingPeerInfo, n as SimulcastLayer, W as WaitingRoomUserInfo } from '../types-B0jEi-Tw.js';
export { P as PeerCaptionLine, a as useCaptionPublisher, u as useRoomSession } from '../use-room-session-BzL2H1A-.js';
import { a as VideoQualityMode } from '../video-quality-DOL7mOQn.js';
export { D as DEFAULT_CAMERA_VIDEO_CONSTRAINTS, b as DEFAULT_VIDEO_QUALITY_MODE, c as DEFAULT_VIDEO_QUALITY_TIER, S as SCREEN_SHARE_ENCODING, d as ScreenShareEncodingProfile, e as VIDEO_QUALITY_PROFILES, f as VIDEO_QUALITY_TIER_ORDER, g as VideoQualityProfile, V as VideoQualityTier, h as getVideoQualityLabel, i as getVideoQualityProfile, j as isCameraVideoTrack, k as isScreenShareVideoTrack } from '../video-quality-DOL7mOQn.js';
export { D as DEFAULT_ROOM_SETTINGS, b as buildAudioOnlyConstraints, a as buildMediaLessConstraints, c as buildPrejoinMediaConstraints, d as buildVideoOnlyConstraints, g as getOrCreateLobbyUserId, e as getStoredDisplayName, f as getStoredGuestId, h as getStoredGuestToken, r as resolveRoomDisplayName, s as sanitizeDisplayName, i as setStoredDisplayName, j as setStoredGuestSession } from '../room-session-storage-fC9S1Jyh.js';
export { M as MeetingErrorKind, a as MeetingErrorViewModel, S as SdpInfo, b as analyzeSdp, c as buildSignalingWsUrl, i as isMeetingErrorBlocking, d as isValidIceCandidateInit, l as logSdpAnalysis, m as mergeRemoteTrack, n as normalizeSdp, e as normalizeSdpText, p as parseIceCandidateInit, f as parseSignalingMessage, g as participantHasDisplayableVideo, r as repairSdpForNegotiation, h as resolveAccessToken, j as resolveMeetingError, s as sanitizeSdpSafe, k as serializeIceCandidate, o as signalingErrorMessage, q as signalingErrorViewModel, t as signalingLog, u as signalingWarn, v as stopMediaStream, w as validateRoomModeSdp, x as wireLobbyOutgoing, y as wireOutgoing } from '../helpers-DN-TLYSB.js';

type SignalingSocketOptions = {
    onError?: (message: string) => void;
    onReconnect?: () => void;
    autoReconnect?: boolean;
    token?: string | null;
    wsUrl?: string;
};
declare function useSignalingSocket(enabled: boolean, onMessage: (message: SignalingIncomingMessage) => void | Promise<void>, onOpen?: () => void, options?: SignalingSocketOptions): {
    send: (message: SignalingOutgoingMessage) => void;
    close: () => void;
};

declare function useBroadcastViewer(streamId: string, enabled?: boolean, options?: {
    token?: string;
}): {
    remoteStream: MediaStream | null;
    connected: boolean;
    connecting: boolean;
    playing: boolean;
    error: string | null;
    connectionQuality: ConnectionQuality;
};

declare function readVideoQualityMode(): VideoQualityMode;
declare function writeVideoQualityMode(mode: VideoQualityMode): void;
declare const VIDEO_QUALITY_MODE_OPTIONS: {
    value: VideoQualityMode;
    label: string;
    description: string;
}[];

export { ConnectionQuality, SignalingIncomingMessage, SignalingOutgoingMessage, VIDEO_QUALITY_MODE_OPTIONS, VideoQualityMode, readVideoQualityMode, useBroadcastViewer, useSignalingSocket, writeVideoQualityMode };
