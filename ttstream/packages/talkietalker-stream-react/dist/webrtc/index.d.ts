import { P as ParsedStats, C as ConnectionQuality } from '../types-B0jEi-Tw.js';
import { V as VideoQualityTier } from '../video-quality-DOL7mOQn.js';

interface PeerConnectionCallbacks {
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onTrack: (track: MediaStreamTrack, streams: readonly MediaStream[]) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
    onIceFailure: () => void;
    onNegotiationComplete?: () => void;
    onBeforeCreateAnswer?: (pc: RTCPeerConnection, isRenegotiation: boolean) => void | Promise<void>;
    onStatsUpdate?: (stats: ParsedStats, quality: ConnectionQuality) => void;
}
type SdpSanitizationMode = "none" | "safe" | "legacy";
type AnswerValidationMode = "off" | "warn" | "strict";
interface PeerConnectionOptions {
    simulcast?: boolean;
    /** @deprecated Use sdpSanitization instead */
    sanitizeOfferSdp?: boolean;
    sdpSanitization?: SdpSanitizationMode;
    waitForIceGathering?: boolean;
    iceGatheringTimeoutMs?: number;
    /** @deprecated Use answerValidation instead */
    strictAnswerValidation?: boolean;
    answerValidation?: AnswerValidationMode;
    maxPendingIceCandidates?: number;
}
/**
 * Production room defaults: safe SDP normalization, short ICE gather window,
 * validation warnings only (never blocks a working negotiation).
 */
declare const ROOM_PEER_CONNECTION_OPTIONS: PeerConnectionOptions;
declare class PeerConnectionManager {
    private pc;
    private callbacks;
    private options;
    private offerChain;
    private pendingCandidates;
    private iceRestartHandler;
    private statsCollector;
    private disposed;
    private currentVideoTier;
    constructor(callbacks: PeerConnectionCallbacks, config?: RTCConfiguration, options?: PeerConnectionOptions);
    get connection(): RTCPeerConnection;
    get connectionState(): RTCPeerConnectionState;
    get iceConnectionState(): RTCIceConnectionState;
    get videoQualityTier(): VideoQualityTier;
    applyVideoQualityTier(tier: VideoQualityTier, track?: MediaStreamTrack | null): Promise<boolean>;
    configureScreenShareSender(track?: MediaStreamTrack | null): Promise<boolean>;
    private findPrimaryVideoSender;
    private applyEncodingParams;
    attachLocalTracks(localStream: MediaStream): void;
    ensureRecvTransceivers(): void;
    handleRemoteOffer(sdp: string, localStream?: MediaStream | null): Promise<string | null>;
    handleRemoteCandidate(candidateJson: string): Promise<void>;
    startStatsPolling(): void;
    stopStatsPolling(): void;
    close(): void;
    private syncLocalSenders;
    private ensureSendRecvForLocalSenders;
    private answerNeedsSendRecvRetry;
    private configureVideoSender;
    private configureSimulcast;
    private attachEventHandlers;
    private isReadyForIce;
    private flushPendingCandidates;
    private rollbackIfNeeded;
    private prepareMediaBeforeAnswer;
}

export { PeerConnectionManager, ROOM_PEER_CONNECTION_OPTIONS };
