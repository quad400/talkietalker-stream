import { j as SignalingIncomingMessage, l as SignalingParticipant, k as SignalingOutgoingMessage } from './types-B0jEi-Tw.js';

type WireMessage = {
    type: string;
    payload: Record<string, unknown>;
};
declare function signalingLog(message: string, data?: unknown): void;
declare function signalingWarn(message: string, data?: unknown): void;
declare function buildSignalingWsUrl(token?: string | null, wsUrl?: string): string;
/** Resolves an access token for WebSocket connections. */
declare function resolveAccessToken(explicitToken?: string | null): Promise<string | null>;
declare function normalizeSdp(value: unknown): string | null;
declare function wireOutgoing(message: SignalingOutgoingMessage): WireMessage;
declare function wireLobbyOutgoing(type: string, payload: Record<string, unknown>): string;
declare function parseSignalingMessage(raw: string): SignalingIncomingMessage | null;
type MeetingErrorKind = "connection" | "permission" | "waiting" | "room" | "media" | "removed" | "unknown";
interface MeetingErrorViewModel {
    kind: MeetingErrorKind;
    title: string;
    description: string;
    code?: string;
    recoverable: boolean;
    /** When false, show as a dismissible notice — never tear down media or block the UI. */
    blocking: boolean;
}
declare function isMeetingErrorBlocking(error: MeetingErrorViewModel, inSession: boolean): boolean;
declare function resolveMeetingError(input: {
    code?: string;
    message?: string;
}): MeetingErrorViewModel;
declare function signalingErrorMessage(message: SignalingIncomingMessage): string;
declare function signalingErrorViewModel(message: SignalingIncomingMessage): MeetingErrorViewModel;
declare function serializeIceCandidate(candidate: RTCIceCandidate): string;
declare function participantHasDisplayableVideo(participant: SignalingParticipant): boolean;
declare function stopMediaStream(stream: MediaStream | null): void;
declare function mergeRemoteTrack(existing: MediaStream | null, track: MediaStreamTrack): MediaStream;

declare function normalizeSdpText(sdp: string): string;
/**
 * Browser-oriented SDP repair — keeps all media attrs, fixes common parse failures.
 * - Lowercase fingerprint hashes (Chrome is strict on some builds)
 * - Drop redundant session-level DTLS lines when media sections already carry them
 */
declare function repairSdpForNegotiation(sdp: string): string;
/** Safe for room SFU — format normalization + browser repair, never strips codec attrs. */
declare function sanitizeSdpSafe(sdp: string): string;
declare function isValidIceCandidateInit(init: RTCIceCandidateInit): init is RTCIceCandidateInit;
declare function parseIceCandidateInit(candidateJson: string): RTCIceCandidateInit | null;
/**
 * SDP Validation & Debugging Utilities
 */
interface SdpInfo {
    hasIceUfrag: boolean;
    hasIcePwd: boolean;
    hasFingerprint: boolean;
    hasSetup: boolean;
    mediaLines: number;
    audioLines: number;
    videoLines: number;
    hasSendrecv: boolean;
    hasRecvonly: boolean;
    hasSendonly: boolean;
    lineCount: number;
}
declare function analyzeSdp(sdp?: string | null): SdpInfo;
declare function validateRoomModeSdp(sdp: string, context: "offer" | "answer"): {
    valid: boolean;
    critical: string[];
    warnings: string[];
};
declare function logSdpAnalysis(sdp: string, label: string, context?: "offer" | "answer"): void;

export { type MeetingErrorKind as M, type SdpInfo as S, type MeetingErrorViewModel as a, analyzeSdp as b, buildSignalingWsUrl as c, isValidIceCandidateInit as d, normalizeSdpText as e, parseSignalingMessage as f, participantHasDisplayableVideo as g, resolveAccessToken as h, isMeetingErrorBlocking as i, resolveMeetingError as j, serializeIceCandidate as k, logSdpAnalysis as l, mergeRemoteTrack as m, normalizeSdp as n, signalingErrorMessage as o, parseIceCandidateInit as p, signalingErrorViewModel as q, repairSdpForNegotiation as r, sanitizeSdpSafe as s, signalingLog as t, signalingWarn as u, stopMediaStream as v, validateRoomModeSdp as w, wireLobbyOutgoing as x, wireOutgoing as y };
